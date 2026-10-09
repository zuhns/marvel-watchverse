export function TvaMascot() {
  return (
    <svg
      className="miss-minutes"
      viewBox="0 0 130 130"
      role="img"
      aria-label="Miss Minutes, guida della TVA"
    >
      <g className="minutes-leg left">
        <path
          d="M49 92 Q45 106 36 111"
          fill="none"
          stroke="#372618"
          strokeWidth="5"
        />
        <ellipse cx="31" cy="113" rx="15" ry="7" fill="#372618" />
      </g>
      <g className="minutes-leg right">
        <path
          d="M78 92 Q81 107 89 112"
          fill="none"
          stroke="#372618"
          strokeWidth="5"
        />
        <ellipse cx="94" cy="114" rx="15" ry="7" fill="#372618" />
      </g>
      <path
        d="M31 60 Q18 62 13 45 M98 58 Q108 51 112 35"
        fill="none"
        stroke="#382719"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g className="minutes-hand">
        <path
          d="M111 35 l-2-12 q1-5 4-2 l3 10 5-5 q5-2 3 3 l-5 9 q-5 9-8-3"
          fill="#fff0cf"
          stroke="#382719"
          strokeWidth="2"
        />
      </g>
      <path
        d="M13 46 q-8-3-5-10 l4-3 3 5 3-2 3 10Z"
        fill="#fff0cf"
        stroke="#382719"
        strokeWidth="2"
      />
      <circle
        cx="64"
        cy="57"
        r="41"
        fill="#c6652e"
        stroke="#39271d"
        strokeWidth="4"
      />
      <circle
        cx="64"
        cy="57"
        r="34"
        fill="#edaa55"
        stroke="#f8cd83"
        strokeWidth="2"
      />
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={i}
          d="M64 25v4"
          transform={`rotate(${i * 30} 64 57)`}
          stroke="#764321"
          strokeWidth="2"
        />
      ))}
      <g
        fill="#744221"
        fontFamily="Georgia,serif"
        fontSize="8"
        fontWeight="bold"
        textAnchor="middle"
      >
        <text x="64" y="33">
          12
        </text>
        <text x="91" y="60">
          3
        </text>
        <text x="64" y="87">
          6
        </text>
        <text x="38" y="60">
          9
        </text>
      </g>
      <path
        className="minutes-clock-hand"
        d="M64 57V35 M64 57l13 6"
        fill="none"
        stroke="#7b4424"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".6"
      />
      <g className="minutes-eyes">
        <ellipse
          cx="54"
          cy="51"
          rx="9"
          ry="13"
          fill="#fff3d6"
          stroke="#39271d"
          strokeWidth="2"
        />
        <ellipse
          cx="74"
          cy="51"
          rx="9"
          ry="13"
          fill="#fff3d6"
          stroke="#39271d"
          strokeWidth="2"
        />
        <ellipse cx="56" cy="53" rx="4.5" ry="8" fill="#39271d" />
        <ellipse cx="76" cy="53" rx="4.5" ry="8" fill="#39271d" />
        <circle cx="57" cy="50" r="1.5" fill="#fff3d6" />
        <circle cx="77" cy="50" r="1.5" fill="#fff3d6" />
      </g>
      <path
        d="M48 69 Q63 88 80 68 Q63 78 48 69"
        fill="#4d2a1c"
        stroke="#39271d"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M53 72 Q64 78 76 71"
        stroke="#fff0ce"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}
