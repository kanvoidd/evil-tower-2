/**
 * Правила кода (PROJECT-DECISIONS.md, «Правила кода: форматирование, импорты, сложность»).
 *
 * Ошибки — самое вредное: расхождение с Prettier (проверяется в `npm run lint` вместе с ESLint),
 * импорты и сложность функций. Предупреждения — размер файлов и функций, число параметров, `any`.
 * Правила слоёв и доменных областей здесь не дублируются — их проверяет `npm run archtest`.
 */
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

/** Ошибки: импорты и сложность функции — для любого кода проекта. */
const errors = {
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
  'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
  complexity: ['error', 15],
  'max-depth': ['error', 4],
  'max-nested-callbacks': ['error', 3],
};

/** Предупреждения: размер и форма кода. */
const warnings = {
  'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
  'max-params': ['warn', 4],
};

/**
 * Переходный список: код, написанный до правил. Сложность в этих файлах пока — предупреждение;
 * буква — этап плана (docs/REFACTORING-PLAN-2.md), который файл разберёт и уберёт из списка.
 * Новый код сюда не попадает. К концу второго круга список пуст (кроме сменного блока H).
 */
const legacyComplexity = {
  'src/domain/combat/room-battle/RoomBattle.ts': 'D',
  'src/domain/progression/skill-tree/skillTree.ts': 'C6',
  'src/infrastructure/store/ProfileStore.ts': 'G3',
  'src/presentation/animations/GameEventPlayer.ts': 'F2',
  'src/presentation/components/pan-controller/PanController.ts': 'F3',
  'src/presentation/components/plate-button/PlateButton.ts': 'F3',
  'src/presentation/components/text/Text.ts': 'F3',
  'src/presentation/views/skill-tree/NodeView.ts': 'F3',
  'src/presentation/views/skill-tree/SkillInfoPanel.ts': 'F3',
  'src/presentation/animations/effects/vfx/Vfx.ts': 'H',
  'src/infrastructure/audio/WebAudioPlayer.ts': 'H',
  'src/composition/DevParams.ts': 'I',
  'tools/sim.ts': 'I',
  'tools/selftest.ts': 'I',
};

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'android/**', 'public/**', 'store/**'] },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin, 'simple-import-sort': simpleImportSort },
    rules: {
      ...errors,
      ...warnings,
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.mjs'],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: { ...errors, ...warnings },
  },
  {
    files: Object.keys(legacyComplexity),
    rules: {
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-nested-callbacks': ['warn', 3],
    },
  },
);
