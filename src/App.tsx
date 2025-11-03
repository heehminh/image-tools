import { useMemo, useRef, useState } from "react";

type Transform = { rotateDeg: number; flipX: boolean; flipY: boolean };
type ActionType =
  | "rotateLeft45"
  | "rotateRight45"
  | "flipX"
  | "flipY"
  | "reset";
type Action = {
  id: number;
  type: ActionType;
  label: string;
  at: string; // 저장만, 표시 안 함
  after: Transform; // 액션 적용 후 상태
};

const initialT: Transform = { rotateDeg: 0, flipX: false, flipY: false };
const degNorm = (d: number) => ((d % 360) + 360) % 360;

export default function ImageEditor() {
  const [src, setSrc] = useState<string | null>(null);
  const [t, setT] = useState<Transform>(initialT);
  const [history, setHistory] = useState<Action[]>([]);
  const idRef = useRef(0); // StrictMode에서도 중복 방지용

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File) => {
    const url = URL.createObjectURL(f);
    setSrc(url);
    // 새 이미지면 전체 초기화
    setT(initialT);
    setHistory([]);
    idRef.current = 0;
  };

  const pushAction = (type: ActionType, label: string, next: Transform) => {
    const id = ++idRef.current;
    setHistory((h) => [
      ...h,
      { id, type, label, at: new Date().toLocaleTimeString(), after: next },
    ]);
  };

  const apply = (type: ActionType) => {
    if (type === "reset") {
      setT(initialT);
      setHistory([]);
      idRef.current = 0;
      return;
    }

    // 현재 상태(t) 기준으로 next 계산
    const next: Transform = { ...t };
    if (type === "rotateLeft45") next.rotateDeg = degNorm(t.rotateDeg - 45);
    if (type === "rotateRight45") next.rotateDeg = degNorm(t.rotateDeg + 45);
    if (type === "flipX") next.flipX = !t.flipX;
    if (type === "flipY") next.flipY = !t.flipY;

    setT(next);

    const label =
      type === "rotateLeft45"
        ? "왼쪽 45°"
        : type === "rotateRight45"
        ? "오른쪽 45°"
        : type === "flipX"
        ? "좌우반전"
        : "상하반전";

    pushAction(type, label, next);
  };

  const undo = () => {
    if (!history.length) return;
    const nh = history.slice(0, -1);
    const last = nh.at(-1)?.after ?? initialT;
    setHistory(nh);
    setT(last);
    idRef.current = nh.at(-1)?.id ?? 0; // id 연속성 유지
  };

  const previewStyle = useMemo<React.CSSProperties>(
    () => ({
      maxWidth: "100%",
      transform: `rotate(${t.rotateDeg}deg) scaleX(${
        t.flipX ? -1 : 1
      }) scaleY(${t.flipY ? -1 : 1})`,
      transformOrigin: "center center",
    }),
    [t]
  );

  return (
    <div style={{ display: "flex", width: "100vw", justifyContent: "center" }}>
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={{ margin: 0, fontSize: 18, color: "#111827" }}>
            도형 회전하기 연습
          </h1>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginLeft: "20px",
              color: "#111827",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && onFile(e.target.files[0])}
            />
            {src && (
              <>
                <button onClick={() => apply("rotateLeft45")}>
                  ↶ 왼쪽 45° 회전
                </button>
                <button onClick={() => apply("rotateRight45")}>
                  ↷ 오른쪽 45° 회전
                </button>
                <button onClick={() => apply("flipX")}>좌우반전</button>
                <button onClick={() => apply("flipY")}>상하반전</button>
                <button onClick={() => apply("reset")}>전체 초기화</button>
                <button onClick={undo} disabled={!history.length}>
                  하나 지움
                </button>
              </>
            )}
          </div>
        </header>

        {!src ? (
          <div style={{ padding: 24, color: "#6b7280" }}>
            이미지를 업로드하세요.
          </div>
        ) : (
          <main style={styles.main}>
            {/* 좌: 원본 / 우: 결과 */}
            <section style={styles.stageWrap}>
              <div style={styles.stageCol}>
                <div style={styles.stageTitle}>전 (원본)</div>
                <div style={styles.stage}>
                  <img
                    src={src}
                    alt="original"
                    style={{ maxWidth: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>

              <div style={styles.stageCol}>
                <div style={styles.stageTitle}>후</div>
                <div style={styles.stage}>
                  <img
                    ref={imgRef}
                    src={src}
                    alt="preview"
                    style={previewStyle}
                  />
                </div>
              </div>
            </section>

            {/* 우: 히스토리(버튼 로그 + 썸네일) */}
            <aside style={styles.sidebar}>
              <div
                style={{ fontWeight: 600, marginBottom: 8, color: "#111827" }}
              >
                액션 히스토리
              </div>
              {!history.length && (
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  아직 수행한 액션이 없습니다.
                </div>
              )}
              <ul style={styles.historyList}>
                {history.map((a) => (
                  <li key={a.id} style={styles.historyItem}>
                    <div style={styles.thumb}>
                      {/* 썸네일은 CSS transform으로 빠르게 미리보기 */}
                      <img
                        src={src!}
                        alt={`step ${a.id}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          transform: `rotate(${a.after.rotateDeg}deg) scaleX(${
                            a.after.flipX ? -1 : 1
                          }) scaleY(${a.after.flipY ? -1 : 1})`,
                          transformOrigin: "center center",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        color: "#111827",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        #{a.id} {a.label}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </main>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  header: {
    margin: "20px",
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 10,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 16,
    padding: 16,
  },
  stageWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    alignItems: "start",
  },
  stageCol: {},
  stageTitle: { marginBottom: 8, fontWeight: 600 },
  stage: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#fafafa",
    height: 420,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  sidebar: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 12,
    height: 520,
    overflow: "auto",
    background: "#fff",
  },
  historyList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 8,
  },
  historyItem: {
    display: "grid",
    gridTemplateColumns: "64px 1fr",
    gap: 10,
    alignItems: "center",
    border: "1px solid #f3f4f6",
    borderRadius: 8,
    padding: 8,
    background: "#fafafa",
    color: "#111827",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    background: "#fff",
    display: "grid",
    placeItems: "center",
  },
};
