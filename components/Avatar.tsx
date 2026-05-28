type AvatarProps = {
  avatar: string;
  size?: number;
  gradient?: string;
  className?: string;
  style?: React.CSSProperties;
  fontSize?: string;
};

export default function Avatar({
  avatar,
  size = 36,
  gradient = "linear-gradient(135deg, #FF6B6B, #FF9E4F)",
  className = "",
  style = {},
  fontSize,
}: AvatarProps) {
  const isImage = avatar?.startsWith("http");
  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...style,
  };

  if (isImage) {
    return (
      <img
        src={avatar}
        alt=""
        className={className}
        style={{ ...base, objectFit: "cover", background: "#eee" }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ ...base, background: gradient, color: "white", fontWeight: 700, fontSize: fontSize ?? `${Math.round(size * 0.38)}px` }}
    >
      {avatar ?? "?"}
    </div>
  );
}
