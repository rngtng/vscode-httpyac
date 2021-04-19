
import { log, utils } from 'httpyac';
import { window } from 'vscode';
import { getConfigSetting } from '../config';

export function errorHandler(this: unknown): MethodDecorator {
  return (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = errorHandlerWrapper.bind(this)(target, propertyKey, originalMethod);
    return descriptor;
  };
}

export function errorHandlerWrapper(target: unknown, propertyKey: string | symbol, method: (...args: unknown[]) => unknown) {
  return function (this: unknown, ...args: unknown[]) : unknown{
    try {
      const result = method.apply(this, args);
      if (utils.isPromise(result)) {
        return result.catch(err => handleError(target, propertyKey, err));
      }
      return result;
    } catch (err) {
      handleError(target, propertyKey, err);
    }
    return undefined;
  };
}

async function handleError(_target: unknown, _propertyKey: string | symbol, err: unknown) {
  log.error(err);

  if (getConfigSetting().showNotificationPopup) {
    if (err instanceof Error) {
      await window.showErrorMessage(err.stack || `${err.name} - ${err.message}`);
    } else if (utils.isString(err)) {
      await window.showErrorMessage(err);
    } else {
      await window.showErrorMessage(JSON.stringify(err, null, 2));
    }
  }
}
