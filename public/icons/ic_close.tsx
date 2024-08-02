type CloseIconProps = {
	width: number;
	height: number;
};
export default function CloseIcon({ width, height }: CloseIconProps) {
	return (
		<svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M18 6L6 18" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M6 6L18 18" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}
