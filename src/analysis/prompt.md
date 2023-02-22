在 `prompts` 库中，每个问题（prompt）的配置对象可以有一个名为 `type` 的属性，它可以是以下之一：

- 一个字符串，表示 prompt 类型，例如 `"text"`, `"select"`, `"confirm"` 等等。
- 一个函数，函数接收两个参数：`(previousAnswers: any[], promptContext: Object) => any`。其中，`previousAnswers` 表示之前已经回答过的问题的答案数组，`promptContext` 表示当前 prompt 的上下文信息，包括其他的 prompt 配置信息以及一些 helper 函数等等。函数需要返回一个字符串，表示 prompt 类型。这个函数的好处是可以根据前面的回答情况和其他上下文信息动态地选择 prompt 类型，这样就可以实现更灵活的交互体验。

