/**常用邮箱 */
export const commonEmailPattern =
  /(qq\.com)|(163\.com)|(126\.com)|(gmail\.com)|(yeah\.net)|(sina\.com)|(zoho\.com)|(soho\.com)|(outlook\.com)|(21cn\.com)|(aliyun\.com)|(hotmail\.com)|(wo\.cn)|(foxmail\.com)|(139\.com)|(189\.cn)/g;

/**邮箱校验 */
export const emailPattern =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const companyEnPattern = /^[\w][\w()™\s-[\],&<>!@#&`?の:;+=/%~]*$/;
export const chinesePattern = /[\u4e00-\u9fa5]+/g;

/**手机号 */
export const phoneNumberPattern = /^(13[0-9]|14[0-9]|15[0-9]|16[0-9]|17[0-9]|18[0-9]|19[0-9])\d{8}$/;

/**联系方式 */
export const contactPattern = /^[0-9][0-9-]+$/;
