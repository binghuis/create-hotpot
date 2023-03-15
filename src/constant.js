"use strict";
exports.__esModule = true;
var kolorist_1 = require("kolorist");
var FRAMEWORKS = [
    {
        name: "desktop",
        display: "Desktop",
        color: kolorist_1.green,
        variants: [
            {
                name: "react-desktop",
                display: "React",
                color: kolorist_1.yellow
            },
            {
                name: "vue-desktop",
                display: "Vue",
                color: kolorist_1.blue
            },
        ]
    },
    {
        name: "mobile",
        display: "Mobile",
        color: kolorist_1.cyan,
        variants: [
            {
                name: "react-mobile",
                display: "React",
                color: kolorist_1.yellow
            },
            {
                name: "vue-mobile",
                display: "Vue",
                color: kolorist_1.blue
            },
        ]
    },
    {
        name: "docs",
        display: "Docs",
        color: kolorist_1.cyan,
        variants: [
            {
                name: "astro-docs",
                display: "Astro",
                color: kolorist_1.yellow
            },
        ]
    },
];
exports.FRAMEWORKS = FRAMEWORKS;
