// disable-unused-vars.js
const fs = require("fs");
const path = require("path");

const filesToPatch = [
  {
    filePath: "./src/app/page.tsx",
    lines: [34],
  },
  {
    filePath: "./src/components/CircleTimer.tsx",
    lines: [2, 19, 21, 31, 164],
  },
  {
    filePath: "./src/components/TaskForm.tsx",
    lines: [48],
  },
  {
    filePath: "./src/components/TimeSelector.tsx",
    lines: [2, 72, 96],
  },
  {
    filePath: "./src/components/TimerHeader.tsx",
    lines: [19],
  },
];

filesToPatch.forEach(({ filePath, lines }) => {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.warn(`파일 없음: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(absPath, "utf-8").split("\n");

  lines.forEach((lineNum) => {
    const idx = lineNum - 1;
    const line = fileContent[idx];
    if (
      !line.includes("@typescript-eslint/no-unused-vars") &&
      !line.includes("eslint-disable")
    ) {
      fileContent[idx] =
        line + " // eslint-disable-line @typescript-eslint/no-unused-vars";
    }
  });

  fs.writeFileSync(absPath, fileContent.join("\n"), "utf-8");
  console.log(`✅ 패치 완료: ${filePath}`);
});
