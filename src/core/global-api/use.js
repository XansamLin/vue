/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 获取已安装的插件数组列表，在Vue定义了_installedPlugins属性，并让
    // installedPlugins执行这个属性，后续对installedPlugins的操作等同于
    // 对Vue._installedPlugins的操作。此写法非常简洁。
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 如果在要安装的插件已在安装的插件列表，直接返回Vue构造函数
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // 将函数参数列表转化为数组，并在此数组的头部添加Vue函数
    const args = toArray(arguments, 1)
    args.unshift(this)
    // 如果传入的参数是一个对象，并包含install方法，执行此install方法
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    // 如果传入的参数是一个函数，直接执行。
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    // 将已经安装的插件加入到Vue._installedPlugins属性，缓存起来，如果后续
    // 再安装相同的插件，直接返回Vue函数
    installedPlugins.push(plugin)
    return this
  }
}
