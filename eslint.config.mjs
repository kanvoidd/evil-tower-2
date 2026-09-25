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
 * Новый код сюда не попадает. К концу второго круга список пуст.
 */
const legacyComplexity = {
  'src/composition/DevParams.ts': 'I',
  'tools/sim.ts': 'I',
};

/**
 * Сменный блок: процедурная графика и звук — временные заглушки, которые заменят картинки и файлы
 * (PROJECT-DECISIONS.md, «Процедурная графика и звук — сменный блок»). Внутри их не разбираем:
 * размер и сложность — не повод для правки; импорты и форматирование проверяются как везде.
 */
const replaceableBlock = [
  'src/presentation/textures/**',
  'src/presentation/animations/effects/vfx/**',
  'src/infrastructure/audio/**',
];

/**
 * Самопроверка — длинные списки проверок по темам: размер файла для неё не мерило. Сложность и
 * длина функций проверяются как везде (разделы — код верхнего уровня, функции в них — помощники).
 */
const selftestFiles = ['tools/selftest/**'];

/**
 * Числа в правилах игры и в потоках приложения — только с именем: полем баланса, константой
 * класса или модуля. Разрешены 0, 1, −1, 2 и 100 (проценты), индексы, значения по умолчанию,
 * литеральные типы и неизменяемые поля класса — там имя у числа уже есть.
 */
const namedNumbers = [
  'warn',
  {
    ignore: [0, 1, -1, 2, 100],
    ignoreArrayIndexes: true,
    ignoreDefaultValues: true,
    ignoreClassFieldInitialValues: true,
    ignoreReadonlyClassProperties: true,
    ignoreNumericLiteralTypes: true,
    ignoreEnums: true,
    ignoreTypeIndexes: true,
    detectObjects: false,
  },
];

/**
 * Таблицы чисел: файлы, где число — само определение (содержимое каталога, баланс областей,
 * таблицы наград и цен). Имя числу даёт поле или запись, в которой оно стоит.
 */
const numberTables = [
  'src/domain/catalog/heroes/*-factory/**',
  'src/domain/catalog/floors/**',
  'src/domain/catalog/**/*Registry.ts',
  'src/domain/*/balance/**',
  'src/domain/rewards/daily/dailyRewards.ts',
  'src/domain/rewards/tower-gift/giftReward.ts',
  'src/domain/rewards/achievements/achievementRegistry.ts',
];

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
    files: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
    ignores: numberTables,
    rules: { '@typescript-eslint/no-magic-numbers': namedNumbers },
  },
  {
    files: ['**/*.mjs'],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: { ...errors, ...warnings },
  },
  {
    files: replaceableBlock,
    rules: {
      complexity: 'off',
      'max-depth': 'off',
      'max-nested-callbacks': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-params': 'off',
    },
  },
  {
    files: selftestFiles,
    rules: { 'max-lines': 'off' },
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
