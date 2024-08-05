export default function HeartIcon({ width, height, color = "#64748B" }: { width: number; height: number; color?: string }) {
	return (
		<svg width={width} height={height} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M3.55791 9.31157C3.4082 9.18016 3.28843 9.07475 3.20065 8.99739V8.95147L3.02492 8.77574C2.33111 8.08193 1.93398 7.16547 1.93398 6.2V6.07612C1.99545 4.2062 3.59252 2.66667 5.46732 2.66667C5.7456 2.66667 6.11481 2.76344 6.48286 2.96162C6.83019 3.14864 7.13506 3.40383 7.3375 3.68842C7.63199 4.31494 8.53978 4.30366 8.81218 3.65457C8.97992 3.36092 9.27391 3.0955 9.62623 2.89902C9.99385 2.694 10.3603 2.6 10.6007 2.6C12.53 2.6 14.0723 4.12742 14.134 6.07581V6.2C14.134 7.24201 13.7306 8.14473 13.0619 8.75771L12.8673 8.93606V8.97957C12.7662 9.06525 12.6359 9.17766 12.484 9.30974C12.1469 9.6029 11.6955 9.99999 11.2039 10.4332C11.0462 10.5722 10.8844 10.7149 10.7208 10.8592C9.86455 11.6143 8.96001 12.4119 8.34664 12.9417C8.17012 13.0861 7.89785 13.0861 7.72132 12.9417C6.98911 12.3093 5.8265 11.2962 4.83715 10.4316C4.34152 9.9984 3.88978 9.60286 3.55791 9.31157Z"
				stroke={color}
				stroke-width="1.2"
			/>
		</svg>
	);
}
