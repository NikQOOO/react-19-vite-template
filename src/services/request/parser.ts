import type { AxiosError } from 'axios';

const codeMessage: [unknown, string][] = [
  [400, 'Request Error.'],
  [401, 'No Permission! (wrong token, username, password). Please Sign again.'],
  [403, 'Authorized, but access is prohibited.'],
  [404, 'Request No Found.'],
  [405, 'The request method is not allowed.'],
  [429, 'Server is busy, please try again later'],
  [500, 'The connection to the server is unstable, please try again later.'],
  [502, 'Gateway error.'],
  [503, 'The service is unavailable, the server is temporarily overloaded or under maintenance.'],
  [504, 'Gateway timed out.'],
];

/**
 *
 * @param error 错误信息处理
 * @returns 错误信息
 */
export const errorCodeParser = (error: AxiosError): string => {
  const errorMsgTip = error.message || '';
  const actions = new Map([...codeMessage, ['default', errorMsgTip]]);
  return actions.get(error.response?.status) || actions.get('default') || '';
};

export default errorCodeParser;
