import React, { useState } from "react";
import Image from "next/image";

import Icon from "@/app/_icons";
import defaultImage from "@/public/icons/defaultAvatar.svg";

import ModalWrapper from "@/app/_components/modals/ModalWrapper";
import Button from "@/app/_components/Button";

type MemberProfileProps = {
	email: string;
	userName: string;
	userProfile: string;
	close: () => void;
};

export default function MemberProfile({ email, userName, userProfile, close }: MemberProfileProps): JSX.Element {
	const [buttonText, setButtonText] = useState("이메일 복사하기");

	const handleEmailCopy = () => {
		navigator.clipboard.writeText(email).then(() => {
			setButtonText("복사됨!");
			setTimeout(() => setButtonText("이메일 복사하기"), 1500);
		});
	};

	return (
		<ModalWrapper close={close}>
			<div className="mb-[16px] h-[213px] tablet:h-[234px] tablet:min-w-[328px]">
				<div className="mr-[16px] flex justify-end">
					<button onClick={close} type="button" aria-label="Close modal">
						<Icon.Close width={24} height={24} />
					</button>
				</div>
				<div className="mx-auto mt-[8px] flex w-[280px] flex-col items-center gap-[24px] tablet:h-[186px]">
					<div className="flex flex-col items-center justify-center">
						<div className="relative size-[52px]">
							<Image src={userProfile || defaultImage} alt={userName} fill sizes="52px" className="rounded-md object-cover" />
						</div>
						<div className="text-primary mt-[24px] text-[#CBD5E1]">{userName}</div>
						<p className="mt-2 text-center text-[12px] font-normal text-[#CBD5E1]"> {email}</p>
					</div>
					<div>
						<div className="h-[47px] w-[280px]">
							<Button onClick={handleEmailCopy}>{buttonText}</Button>
						</div>
					</div>
				</div>
			</div>
		</ModalWrapper>
	);
}
