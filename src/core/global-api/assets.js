/* @flow */

/**
 * export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
 */
import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   * Vue[type] === Vue['component'] || Vue.component
   * Vue[type] === Vue['directive'] || Vue.directive
   * Vue[type] === Vue['filter'] || Vue.filter
   * 用于全局的组件注册，指令注册，过滤器注册，使用Vue.component， Vue.directive，Vue.filter 
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
       // this.options._base === Vue, Vue.extend已经在之前定义过了
       // 就是初始化子类构造器，所以definition就是个构造器
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 在全局上挂载，这里要注意的是，如果是注册全局组件，那么definition
        // 其实是一个Vue的子类构造函数
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
