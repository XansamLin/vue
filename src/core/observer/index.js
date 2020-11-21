/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 * Observer类会通过递归的方式把一个对象的所有属性都转化成可观测对象
 * 或者遍历数组里的元素将元素都转化成可观测对象
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    // 实例化一个依赖管理器，用来收集数组||对象依赖
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    // 如果实例化Observer时，传进来的value是一个数组
    if (Array.isArray(value)) {
      // 如果有__propo__属性，将传进来的数组的__propo__指向arrayMethods
      // arrayMethods来自Array.prototype的拷贝，里面数组的方法经过特殊处理
      // 使得在使用这些数组的方法时，能自动更新视图。
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        // 没有__propo__的情况下，在数组实例里显式定义经过特殊处理的数组的方法
        // 从而对数组原型同名方法进行拦截
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 对数组里的元素进行遍历劫持监听
      this.observeArray(value)
    } else {
      // 如果实例化Observer时，传进来的value是一个对象
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // 遍历对象的每个属进行劫持
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   * // 迭代设置数组里的元素为响应式
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
// value: 要进行观察的数据 asRootData: 是否是vm实例的根级别data属性
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 如果value不是对象或者数组或者value是Vnode实例，则返回
  // 因为非对象的属性在defineReactive进行劫持监听就可以了，不用再实例化一个新的Observer实例
  // 也就是不用再递归了 实例化Observer对象 --> defineReactive ---> observe --->  实例化Observer对象
  // 这也是为什么Observer类只对对象与数组进行处理，非对象属性与非数组属性没有额外的__ob__属性
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 如果value的属性__ob__已经是一个Observer实例，则 ob = value.__ob__
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    // 要观察此value，并且不是服务端渲染，并且value不是数组就是一个纯对象
    // 则 ob = new Observer(value)
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  // 如果是根级别（定义在属性data里的属性）数据，则拥有此value作为根级别data的vue实例的数量加1
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 对对象上的某个属性进行拦截监听
 */
export function defineReactive (
  obj: Object, // 对象
  key: string, // 要拦截监听的对象属性
  val: any,   // 要拦截监听的对象属性的值
  customSetter?: ?Function, // 自定义的setter函数
  shallow?: boolean // 是否只进行浅层的遍历劫持
) {
  // 每个被劫持的对象属性都拥有一个dep实例，用于后续的watcher进行依赖收集
  // 因为定义get，set函数形成了闭包，这里可以访问到每个属性特有的dep实例变量
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 如果此对象的属性时不可配置（不能再使用defineProperty对其进行配置）的
  // 则直接返回
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
  // 如果为浅层遍历shallow=true，则不进行深度遍历劫持
  // 否则再调用observe方法再实例化一个obverser进行观察
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 计算访问被拦截属性时要返回的值
      const value = getter ? getter.call(obj) : val
      // 如果当前有watcher被触发，并访问了某些已经被拦截的属性的值
      // 表明此watcher依赖于这些属性的dep
      // 通知dep去收集依赖
      if (Dep.target) {
        // dep收集依赖
        dep.depend()
        // val只能是对象或者数组，因为observe方法只处理传入值为数组或者对象
        /*形如 data: {
          return {
            da1: {
              a: {
                b: 1
              },
              arr: [1, 2, 3]
            }
          }
        } */
        if (childOb) {
          // 让在obverser里的dep也进行收集依赖
          childOb.dep.depend()
          // 如果是数组，需要手动更新数组里元素的依赖
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 更新observer里的dep
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
// 往对象里添加属性，并触发重新收集依赖
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果传入的对象不是响应式，那么直接设置值，并返回
  if (!ob) {
    target[key] = val
    return val
  }
  // 将新的键设置为响应式
  defineReactive(ob.value, key, val)
  // 重新收集依赖（watcher更新，必然访问表达式，必然触发getter，重新收集依赖）
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  // 重新收集依赖
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 * 当数组被访问时，递归收集数组里元素的依赖
 * 因为不能像访问对象的属性的getter那样直接更新依赖，这里需要手动遍历
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
