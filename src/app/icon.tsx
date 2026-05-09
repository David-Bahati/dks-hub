import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          style={{ width: '80%', height: '80%' }}
          fill="none"
        >
          <path
            d="M100 15L178.6 60V140L100 185L21.4 140V60L100 15Z"
            stroke="#00e5ff"
            strokeWidth="10"
          />
          <path
            d="M65 65V135M65 100L95 65M65 100L95 135"
            stroke="#00e5ff"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M135 65V135M135 100L105 65M135 100L105 135"
            stroke="#00e5ff"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
