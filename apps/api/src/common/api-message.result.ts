// 컨트롤러가 기본 "API 호출 성공" 대신 커스텀 성공 메시지를 응답하고 싶을 때 사용.
// ResponseEnvelopeInterceptor가 이 타입을 감지해 message/data를 그대로 envelope에 반영한다.
export class ApiMessageResult<T = null> {
  constructor(
    public readonly message: string,
    public readonly data: T = null as T,
  ) {}
}
