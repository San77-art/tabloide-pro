'use strict';

// Web stub for react-native-worklets 0.5.1
// On web there is no UI thread, so worklet ops are no-ops / passthrough.

const RuntimeKind = { UI: 'UI', JS: 'JS', default: 'JS' };
const getRuntimeKind = () => RuntimeKind.JS;

const shareableMappingCache = new Map();
const serializableMappingCache = new Map();

const runOnUISync = (fn) => fn;
const runOnUIAsync = (fn) => fn;
const scheduleOnUI = (fn) => { if (typeof fn === 'function') fn(); };
const scheduleOnRN = (fn) => { if (typeof fn === 'function') fn(); };
const runOnUI = (fn) => fn;
const runOnJS = (fn) => fn;
const runOnRuntime = (_runtime, fn) => fn;
const callMicrotasks = () => {};
const unstable_eventLoopTask = (fn) => fn;

const makeShareable = (value) => value;
const makeShareableCloneRecursive = (value) => value;
const makeShareableCloneOnUIRecursive = (value) => value;
const isShareableRef = () => false;

const createShareable = (value) => ({ value });
const createSynchronizable = (value) => ({ value });
const isSynchronizable = () => false;
const isWorkletFunction = () => false;

const createSerializable = (value) => value;
const isSerializableRef = () => false;
const createWorkletRuntime = () => ({});
const executeOnUIRuntimeSync = (_runtime, fn) => (typeof fn === 'function' ? fn() : undefined);

const WorkletsModule = { installTurboModule: () => {} };

const getStaticFeatureFlag = () => false;
const setDynamicFeatureFlag = () => {};

module.exports = {
  RuntimeKind,
  getRuntimeKind,
  shareableMappingCache,
  serializableMappingCache,
  runOnUISync,
  runOnUIAsync,
  scheduleOnUI,
  scheduleOnRN,
  runOnUI,
  runOnJS,
  runOnRuntime,
  callMicrotasks,
  unstable_eventLoopTask,
  makeShareable,
  makeShareableCloneRecursive,
  makeShareableCloneOnUIRecursive,
  isShareableRef,
  createShareable,
  createSynchronizable,
  isSynchronizable,
  isWorkletFunction,
  createSerializable,
  isSerializableRef,
  createWorkletRuntime,
  executeOnUIRuntimeSync,
  WorkletsModule,
  getStaticFeatureFlag,
  setDynamicFeatureFlag,
};
