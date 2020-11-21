/* @flow */

import { mergeOptions } from '../util/index'

export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    // 在Vue.options全局里混入mixin对象里的选项
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
