// remove-unused-imports.js
const fs = require("fs");
const path = require("path");

const TARGET_FILES = [
  "./src/app/page.tsx",
  "./src/components/CircleTimer.tsx",
  "./src/components/TimeSelector.tsx",
  "./src/components/TaskForm.tsx",
  "./src/components/TimerHeader.tsx",
];

TARGET_FILES.forEach((filePath) => {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.warn(`❗ 파일을 찾을 수 없습니다: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(absPath, "utf-8");
  const lines = content.split("\n");

  const importLines = lines.filter((line) => line.trim().startsWith("import"));
  const codeLines = lines.filter((line) => !line.trim().startsWith("import"));

  const usedIdentifiers = new Set(
    codeLines.join(" ").match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g)
  );

  const cleanedImports = importLines.filter((line) => {
    const match = line.match(/import\s+{([^}]+)}\s+from/);
    if (!match) return true;

    const importedItems = match[1].split(",").map((i) => i.trim());
    const unused = importedItems.filter((item) => !usedIdentifiers.has(item));

    if (unused.length === importedItems.length) {
      return false; // 모두 미사용 → 제거
    } else if (unused.length > 0) {
      const used = importedItems.filter((item) => usedIdentifiers.has(item));
      const newLine = line.replace(match[1], used.join(", "));
      const idx = lines.indexOf(line);
      lines[idx] = newLine;
    }

    return true;
  });

  const finalContent = [...cleanedImports, ...codeLines].join("\n");
  fs.writeFileSync(absPath, finalContent, "utf-8");
  console.log(`✅ 불필요한 import 정리 완료: ${filePath}`);
});
