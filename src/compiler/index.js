/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
// createCompilerCreator可以根据传入的参数不同，使用parser/optimizer/codegen
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 将模板转化为ast树
  const ast = parse(template.trim(), options)
  // 如果需要优化，则优化ast树
  if (options.optimize !== false) {
    optimize(ast, options)
  }
  // 生成render函数，用于后续生成vnode
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
