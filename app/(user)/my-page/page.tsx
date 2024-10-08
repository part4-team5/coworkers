"use client";

import { useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import API from "@/app/_api/index";

import Icon from "@/app/_icons";

import useAuthStore from "@/app/_store/AuthStore";

import toast from "@/app/_utils/Toast";

import Form from "@/app/_components/Form";

import useCookie from "@/app/_hooks/useCookie";
import useOverlay from "@/app/_hooks/useOverlay";

// import DarkModeToggle from "@/app/_components/DarkModeToggle";

const ChangePasswordModal = dynamic(() => import("@/app/_components/modals/modal-containers/ChangePassword"), { ssr: false });
const AccountDeletionModal = dynamic(() => import("@/app/_components/modals/modal-containers/AccountDeletion"), { ssr: false });

type FormContext = Parameters<Parameters<typeof Form>[0]["onSubmit"]>[0];

export default function Page() {
	const router = useRouter();
	const overlay = useOverlay();
	const queryClient = useQueryClient();
	const { user, setUser } = useAuthStore((state) => state);
	const clearUser = useAuthStore((state) => state.clearUser);
	const [, setAccessToken] = useCookie("accessToken");
	const [, setRefreshToken] = useCookie("refreshToken");

	const res = useQuery({
		queryKey: ["user"],
		queryFn: async () => API["{teamId}/user"].GET({}),
	});

	useEffect(() => {
		if (!user) {
			setUser(res.data as { id: number; email: string; nickname: string; image: string | null });
		}
	}, [res.data, setUser, user]);

	// 이미지 업로드
	const imageUpload = async (file: File) => {
		if (!file) return { url: undefined };
		if (typeof file === "string") return { url: file };

		return API["{teamId}/images/upload"].POST({}, file);
	};

	// 프로필 수정
	const updateProfileMutation = useMutation({
		mutationFn: async (ctx: FormContext) => {
			const file = ctx.values.profileImage as File;
			const nickname = ctx.values.nickname as string;

			if (typeof file === "string" && !nickname) throw new Error("변경된 내용이 없습니다.");

			const { url } = await imageUpload(file);

			const payload: Parameters<(typeof API)["{teamId}/user"]["PATCH"]>[1] = {
				image: url === "init" ? undefined : url,
				nickname: !nickname ? undefined : nickname,
			};

			return API["{teamId}/user"].PATCH({}, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user"] });

			toast.success("프로필 변경이 완료되었습니다.");
		},
		onError: (error) => {
			toast.error(`${error.message ?? "알 수 없는 오류 발생"}`);
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
			API["api/users/{id}"].DELETE({ id: Number(user?.id) });

			queryClient.setQueriesData({ queryKey: ["user"] }, null);
			toast.success("회원 탈퇴가 완료되었습니다.");
			setAccessToken(null);
			setRefreshToken(null);
			clearUser();
			router.push("/");
		},
		onError: (error) => {
			toast.error(`${error.message ?? "알 수 없는 오류 발생"}`);
		},
	});

	// 비밀번호 변경 모달 열기
	const openChangePasswordModal = useCallback(() => {
		overlay.open(({ close }) => <ChangePasswordModal close={close} />);
	}, [overlay]);

	// 회원 탈퇴 모달 열기
	const openAccountDeletionModal = useCallback(() => {
		overlay.open(({ close }) => <AccountDeletionModal onClick={() => deleteAccountMutation.mutate()} close={close} />);
	}, [deleteAccountMutation, overlay]);

	return (
		<main className="box-border w-full bg-background-primary p-[120px_0]">
			<section className="relative m-[0_16px] w-auto tablet:m-[0_auto] tablet:w-[790px]">
				<h2 className="mb-[24px] text-xl font-bold text-text-primary">계정 설정</h2>

				{/* <div className="absolute right-0 top-0">
					<DarkModeToggle />
				</div> */}
				<Form onSubmit={handleUpdateProfile}>
					<div className="flex flex-col gap-[12px] text-text-primary">
						<div className="flex">
							<Form.ImageInput id="profileImage" tests={[{ type: "file_size", data: 1048576, error: "이미지 파일 크기는 1MB 이하여야 합니다" }]}>
								{(file) => (
									<div className="relative flex size-32 cursor-pointer items-center justify-center rounded-lg outline outline-[2px] outline-brand-primary">
										<div className={`border-border-primary/10 relative size-full overflow-hidden rounded-lg bg-background-secondary ${file ? "border-2" : ""}`}>
											{file ? (
												<Image src={file as string} alt="Profile Image" fill className="object-cover" />
											) : (
												<div className="flex size-full items-center justify-center">
													<Icon.EmptyImage width={56} height={56} />
												</div>
											)}
										</div>
										<div className="absolute -bottom-2 -right-2 flex items-center justify-center rounded-full border-2 border-brand-primary bg-dropdown-hover p-1">
											<Icon.Edit width={16} height={16} color="var(--text-primary)" />
										</div>
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
							tests={[{ type: "maxlength", data: 30, error: "30자 이하로 입력해주세요." }]}
						/>
						<Form.Error htmlFor="nickname" />

						<p className="mt-[12px]">이메일</p>
						<div className="flex h-[48px] w-full items-center rounded-[12px] border border-border-primary bg-background-tertiary px-[16px] text-lg font-normal text-text-default shadow-input">
							{user?.email ?? ""}
						</div>

						<div className="mt-[24px] h-12">
							<Form.Submit disabled={updateProfileMutation.isPending}>{updateProfileMutation.isPending ? "저장중..." : "저장하기"}</Form.Submit>
						</div>
					</div>
				</Form>
				<div className="align-center mt-[24px] flex justify-between font-medium">
					<button type="button" onClick={openAccountDeletionModal} className="flex gap-[8px] text-status-danger">
						<Image src="/icons/delete.svg" alt="탈퇴하기" width={24} height={24} />
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
