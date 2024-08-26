"use client";

import API from "@/app/_api/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useOverlay from "@/app/_hooks/useOverlay";
import AccountDeletionModal from "@/app/_components/modal-contents/AccountDeletion";
import useAuthStore from "@/app/_store/useAuthStore";
import Form from "@/app/_components/Form";
import Image from "next/image";
import ChangePasswordModal from "@/app/_components/modal-contents/ChangePassword";
import useCookie from "@/app/_hooks/useCookie";

type FormContext = Parameters<Parameters<typeof Form>[0]["onSubmit"]>[0];

export default function Page() {
	const router = useRouter();
	const overlay = useOverlay();
	const queryClient = useQueryClient();
	const { user, setUser } = useAuthStore();
	const clearUser = useAuthStore((state) => state.clearUser);
	const [accessToken, setAccessToken] = useCookie("accessToken");
	const [, setRefreshToken] = useCookie("refreshToken");

	useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const data = await API["{teamId}/user"].GET({});
			setUser(data);
			return data;
		},
		enabled: !!accessToken,
	});

	// 이미지 업로드
	const imageUpload = async (file: File | null) => {
		if (!file) return null;
		if (typeof file === "string") return { url: file };

		return API["{teamId}/images/upload"].POST({}, file);
	};

	// 프로필 수정
	const updateProfileMutation = useMutation({
		mutationFn: async (ctx: FormContext) => {
			const file = ctx.values.profileImage as File;
			const nickname = ctx.values.nickname as string;

			const uploadedImage = await imageUpload(file);
			const imageUrl = uploadedImage ? uploadedImage.url : (user?.image ?? "");

			const payload: Parameters<(typeof API)["{teamId}/user"]["PATCH"]>[1] = { image: imageUrl, nickname };
			return API["{teamId}/user"].PATCH({}, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user"] });
			alert("프로필 변경이 완료되었습니다.");
			router.replace(window.location.pathname);
		},
		onError: (error) => {
			alert(`${error.message ?? "알 수 없는 오류 발생"}`);
			console.error(error);
		},
	});

	const handleUpdateProfile = useCallback(
		(ctx: FormContext) => {
			updateProfileMutation.mutate(ctx);
		},
		[updateProfileMutation],
	);

	// 회원 탈퇴
	const deleteAccountMutation = useMutation({
		mutationFn: async () => {
			await API["{teamId}/user"].DELETE({});
		},
		onSuccess: () => {
			queryClient.setQueriesData({ queryKey: ["user"] }, null);
			alert("회원 탈퇴가 완료되었습니다.");
			setAccessToken(null);
			setRefreshToken(null);
			clearUser();
			router.push("/");
		},
		onError: (error) => {
			alert(`${error.message ?? "알 수 없는 오류 발생"}`);
			console.error(error);
		},
	});

	// 비밀번호 변경 모달 열기
	const openChangePasswordModal = useCallback(() => {
		overlay.open(({ close }) => <ChangePasswordModal close={close} />);
	}, [overlay]);

	// 회원 탈퇴 모달 열기
	const openAccountDeletionModal = useCallback(() => {
		overlay.open(({ close }) => <AccountDeletionModal onClick={() => deleteAccountMutation.mutate()} close={close} />);
	}, [overlay]);

	return (
		<main className="box-border w-full bg-background-primary p-[40px_0]">
			<section className="m-[0_16px] w-auto tablet:m-[0_auto] tablet:w-[790px]">
				<h2 className="mb-[24px] text-xl font-bold text-text-primary">계정 설정</h2>
				<Form onSubmit={handleUpdateProfile}>
					<div className="flex flex-col gap-[12px] text-text-primary">
						<div className="flex">
							<Form.ImageInput id="profileImage" tests={[{ type: "file_size", data: 1048576, error: "이미지 파일 크기는 1MB 이하여야 합니다" }]}>
								{(file) => (
									<div className="relative flex size-16 cursor-pointer items-center justify-center">
										<div
											className={`border-border-primary/10 relative size-full overflow-hidden rounded-full bg-background-secondary ${file ? "border-2" : ""}`}
										>
											<Image src={file ? (file as string) : (user?.image ?? "/icons/defaultAvatar.svg")} alt="Profile Image" fill />
										</div>

										<Image src="/icons/edit.svg" alt="Profile Preview" width={20} height={20} className="absolute bottom-0 right-0" />
									</div>
								)}
							</Form.ImageInput>
						</div>
						<Form.Error htmlFor="profileImage" />

						<label htmlFor="nickname" className="mt-[12px]">
							이름
						</label>
						<Form.Input
							id="nickname"
							type="text"
							placeholder="이름을 입력해주세요."
							init={user?.nickname ?? ""}
							tests={[
								{ type: "require", data: true, error: "이름을 입력해주세요." },
								{ type: "maxlength", data: 30, error: "30자 이하로 입력해주세요." },
							]}
						/>
						<Form.Error htmlFor="nickname" />

						<p className="mt-[12px]">이메일</p>
						<div className="flex h-[48px] w-full items-center rounded-[12px] border border-border-primary bg-background-tertiary px-[16px] text-lg font-normal text-text-disabled">
							{user?.email ?? ""}
						</div>

						<div className="mt-[24px] h-12">
							<Form.Submit disabled={updateProfileMutation.isPending}>{updateProfileMutation.isPending ? "저장중..." : "저장하기"}</Form.Submit>
						</div>
					</div>
				</Form>
				<div className="align-center mt-[24px] flex justify-between font-medium">
					<button type="button" onClick={openAccountDeletionModal} className="flex gap-[8px] text-status-danger">
						<Image src="/icons/ic_delete.svg" alt="탈퇴하기" width={24} height={24} />
						탈퇴하기
					</button>
					<button type="button" onClick={openChangePasswordModal} className="flex gap-[8px] text-text-emerald">
						<Image src="/images/reset_password.png" alt="비밀번호 변경" width={24} height={24} />
						비밀번호 변경
					</button>
				</div>
			</section>
		</main>
	);
}
