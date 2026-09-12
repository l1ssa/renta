export default function FlowerIcon({size=64}:{size?:number}){
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3">
      <g>
        <ellipse cx="50" cy="30" rx="11" ry="18"/>
        <ellipse cx="50" cy="30" rx="11" ry="18" transform="rotate(72 50 50)"/>
        <ellipse cx="50" cy="30" rx="11" ry="18" transform="rotate(144 50 50)"/>
        <ellipse cx="50" cy="30" rx="11" ry="18" transform="rotate(216 50 50)"/>
        <ellipse cx="50" cy="30" rx="11" ry="18" transform="rotate(288 50 50)"/>
        <circle cx="50" cy="50" r="6"/>
        <path d="M50 78 L50 96" strokeLinecap="round"/>
        <path d="M50 88 C42 88 38 94 34 94" strokeLinecap="round"/>
        <path d="M50 82 C58 82 62 88 66 88" strokeLinecap="round"/>
      </g>
    </svg>
  );
}
