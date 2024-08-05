interface IconProps {
	width: number;
	height: number;
	color?: string;
}

export default function ArrowRightIcon({ width, height, color }: IconProps) {
	return (
		<svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M14.8833 12.7151C15.1834 12.3975 15.1834 11.9008 14.8833 11.5832L9.42402 5.8047C8.91201 5.26275 8.00083 5.6251 8.00083 6.37066V17.9276C8.00083 18.6732 8.91201 19.0355 9.42401 18.4936L14.8833 12.7151Z"
				fill={color}
			/>
		</svg>
	);
}
