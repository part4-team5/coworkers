"use client";

import UserUpload from "@/app/(auth)/_components/UserUpload";
import API from "@/app/_api";
import useCookie from "@/app/_hooks/useCookie";
import useAuthStore from "@/app/_store/useAuthStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function GoogleLogin() {
	const [code] = useState<string>(useSearchParams().get("code") ?? "");
	const [isMounted, setIsMounted] = useState(false);
	const router = useRouter();

	const [, setAccessToken] = useCookie<string>("accessToken");
	const [, setRefreshToken] = useCookie<string>("refreshToken");
	const setUser = useAuthStore((state) => state.setUser);

	const queryClient = useQueryClient();

	const userUpload = UserUpload();

	const googleLoginMutation = useMutation({
		mutationFn: async (): Promise<Awaited<ReturnType<(typeof API)["{teamId}/auth/signIn/{provider}"]["POST"]>>> => {
			// 구글 토큰 변환
			const tokenPayload = new URLSearchParams({
				client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
				client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET as string,
				code,
				grant_type: "authorization_code",
				redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI as string,
			});

			const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: tokenPayload,
			});

			const tokenData = await tokenResponse.json();
			const idToken = tokenData.id_token;

			// 구글 로그인
			const loginPayload: Parameters<(typeof API)["{teamId}/auth/signIn/{provider}"]["POST"]>[1] = {
				redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI as string,
				token: idToken,
			};

			return API["{teamId}/auth/signIn/{provider}"].POST({ provider: "GOOGLE" }, loginPayload);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["user"] });

			// 전역 상태에 유저 정보 저장
			setUser({
				id: data.user.id,
				email: data.user.email ?? "",
				nickname: data.user.nickname,
				image: data.user.image ? data.user.image : null,
			});

			// 몽고 DB에 유저 정보 저장
			userUpload.mutate({ id: data.user.id, email: data.user.email });

			// 쿠키에 토큰 저장
			setAccessToken(data.accessToken);
			setRefreshToken(data.refreshToken);

			router.replace("/");
		},
		onError: (error) => {
			console.log(error);
		},
	});

	useEffect(() => {
		// 컴포넌트가 마운트 되었고, code가 존재할 때
		if (!isMounted && code) {
			setIsMounted(true);

			googleLoginMutation.mutate();
		}
	}, [googleLoginMutation, code, isMounted]);
}
