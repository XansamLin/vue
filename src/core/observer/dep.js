/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    // 每个Dep实例的id
    this.id = uid++
    // 依赖于每个Dep的watcher
    this.subs = []
  }
  // 向Dep实例添加watcher
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }
  // 从Dep实例移除watcher
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }
  // 如果当前有正在计算的watcher，则通知其去收集依赖
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  // 通知依赖此dep的watcher更新数据
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
// taeget: 指向需要被收集的watcher，这个值是全局唯一的，因为
// 同一时间只能处理一个watcher。
// 实现的逻辑是：在watcher里执行getter方法计算表达式或者函数的值，
// 将当前的watcher（依赖）赋值给Dep.target，表示Dep依赖管理器应该去
// 收集哪个依赖
// 从而触发已经被observe的数据的get方法，然后在get方法里收集到这个watcher
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
