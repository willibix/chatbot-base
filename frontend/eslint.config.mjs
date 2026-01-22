/**
 * THIS FILE WAS AUTO-GENERATED.
 * PLEASE DO NOT EDIT IT MANUALLY.
 * ===============================
 * IF YOU COPY THIS INTO AN ESLINT CONFIG, REMOVE THIS COMMENT BLOCK.
 */

import path from "node:path";

import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import { configs, plugins, rules } from "eslint-config-airbnb-extended";
import { rules as prettierConfigRules } from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

const gitignorePath = path.resolve(".", ".gitignore");

const jsConfig = defineConfig([
    // ESLint recommended config
    {
        name: "js/config",
        ...js.configs.recommended,
    },
    // Stylistic plugin
    plugins.stylistic,
    // Import X plugin
    plugins.importX,
    // Airbnb base recommended config
    ...configs.base.recommended,
    // Strict import rules
    rules.base.importsStrict,
]);

const reactConfig = defineConfig([
    // React plugin
    plugins.react,
    // React hooks plugin
    plugins.reactHooks,
    // React JSX A11y plugin
    plugins.reactA11y,
    // Airbnb React recommended config
    ...configs.react.recommended,
    // Strict React rules
    rules.react.strict,
]);

const typescriptConfig = defineConfig([
    // TypeScript ESLint plugin
    plugins.typescriptEslint,
    // Airbnb base TypeScript config
    ...configs.base.typescript,
    // Strict TypeScript rules
    rules.typescript.typescriptEslintStrict,
    // Airbnb React TypeScript config
    ...configs.react.typescript,
]);

const prettierConfig = defineConfig([
    // Prettier plugin
    {
        name: "prettier/plugin/config",
        plugins: {
            prettier: prettierPlugin,
        },
    },
    // Prettier config
    {
        name: "prettier/config",
        rules: {
            ...prettierConfigRules,
            "prettier/prettier": "error",
        },
    },
]);

// Custom rules for 4-space indentation and modern React/Redux patterns
const customRules = defineConfig([
    {
        name: "custom/rules",
        rules: {
            // Use 4 spaces for indentation
            "@stylistic/indent": ["error", 4],
            // JSX indentation
            "@stylistic/jsx-indent-props": ["error", 4],

            // React 19+ doesn't require importing React for JSX
            "react/react-in-jsx-scope": "off",
            "react/jsx-uses-react": "off",

            // Redux Toolkit uses Immer, so param reassignment is safe in reducers
            "no-param-reassign": [
                "error",
                {
                    props: true,
                    ignorePropertyModificationsFor: ["state"],
                },
            ],

            // Allow void operator for floating promises
            "no-void": ["error", { allowAsStatement: true }],

            // Allow nested ternaries (useful in JSX)
            "no-nested-ternary": "off",

            // Relax TypeScript strictness for better DX
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-misused-spread": "off",

            // Import order is handled by Prettier/IDE
            "import-x/order": "off",

            // Allow Fragment shorthand syntax <> </>
            "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
            "react/jsx-fragments": ["error", "syntax"],
        },
    },
]);

export default defineConfig([
    // Ignore files and folders listed in .gitignore
    includeIgnoreFile(gitignorePath),
    // JavaScript config
    ...jsConfig,
    // React config
    ...reactConfig,
    // TypeScript config
    ...typescriptConfig,
    // Prettier config
    ...prettierConfig,
    // Custom indentation rules (must be last to override)
    ...customRules,
]);
