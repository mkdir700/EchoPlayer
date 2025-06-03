import { useMemo } from 'react'
import { createTestIds, testId, withTestId } from '@renderer/utils/test-utils'

/**
 * 自动为组件生成测试标识符的Hook
 * @param componentName 组件名称
 * @param elements 元素映射对象
 */
export function useTestIds<T extends Record<string, string>>(
  componentName: string,
  elements: T
): Record<keyof T, string> & { withTestId: (key: keyof T) => { 'data-testid': string } } {
  const testIds = useMemo(() => {
    return createTestIds(componentName, elements)
  }, [componentName, elements])

  const withTestIdHelper = useMemo(() => {
    return (key: keyof T) => withTestId(testIds[key])
  }, [testIds])

  return {
    ...testIds,
    withTestId: withTestIdHelper
  }
}

/**
 * 为单个组件生成根级测试标识符
 */
export function useComponentTestId(componentName: string): {
  rootTestId: string
  withRootTestId: () => { 'data-testid': string }
} {
  const rootTestId = useMemo(() => testId(componentName), [componentName])

  const withRootTestId = useMemo(() => {
    return () => withTestId(rootTestId)
  }, [rootTestId])

  return {
    rootTestId,
    withRootTestId
  }
}

/**
 * 用于动态列表项的测试标识符Hook
 */
export function useListItemTestIds<T extends { id: string | number }>(
  componentName: string,
  items: T[]
): Array<{
  item: T
  testId: string
  withTestId: () => { 'data-testid': string }
}> {
  return useMemo(() => {
    return items.map((item) => {
      const itemTestId = testId(componentName, 'item', String(item.id))
      return {
        item,
        testId: itemTestId,
        withTestId: () => withTestId(itemTestId)
      }
    })
  }, [componentName, items])
}
