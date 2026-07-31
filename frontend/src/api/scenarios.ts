import { get } from './client'

export interface ScenarioField {
  key: string
  label: string
  type: string
  required?: boolean
  min?: number
  max?: number
  placeholder?: string
}

export interface ScenarioFormGroup {
  group: string
  fields: ScenarioField[]
}

export interface Scenario {
  code: string
  name: string
  icon: string
  target: string
  dimensions: string[]
  default_metrics: string[]
  form_groups: ScenarioFormGroup[]
  prompt_template?: string
}

export const scenariosApi = {
  list: () => get<Scenario[]>('/scenarios'),
  getByCode: (code: string) => get<Scenario & { prompt_template: string }>(`/scenarios/${code}`),
  getTemplateUrl: (code: string) => `/api/v1/scenarios/${code}/template`,
}
