import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 执行_init方法，初始化第一个vue实例
  this._init(options)
}
// 先在vue原型里混入后续需要用到的属性，方法
/**
 * 在Vue原型里混入_init方法
 */
initMixin(Vue)
/**
 * 在Vue原型里混入_update方法，$forceUpdate方法，$destroy方法
 */
lifecycleMixin(Vue)
/**
 * 在Vue原型里混入$on方法，$once方法，$off方法，$emit方法
 */
eventsMixin(Vue)
/**
 * 在Vue原型里混入render时的一些帮助函数，$nextTick方法，_render方法，$destroy方法
 */
renderMixin(Vue)
/**
 * 在Vue原型里混入$data属性，$props属性
 * $set方法，$delete方法，$watch方法
 */
stateMixin(Vue)

export default Vue
