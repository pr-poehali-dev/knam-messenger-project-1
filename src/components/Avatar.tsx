interface AvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
}

const sizeMap = {
  sm: "w-9 h-9 text-sm",
  md: "w-11 h-11 text-base",
  lg: "w-14 h-14 text-xl",
};

export default function Avatar({ name, color, size = "md", isOnline }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-white shadow-md`}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#161b22] ${
            isOnline ? "bg-green-400" : "bg-[#484f58]"
          }`}
        />
      )}
    </div>
  );
}
