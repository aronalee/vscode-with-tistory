# vscode-with-tistory README

## 구현할 기능

- [ ] 이미지 업로드
- [ ] 게시글 수정
  - [ ] postId를 가진 블로그가 실제로 존재하는지 확인
  - [ ] date에 기록된 날짜가 현재시간보다 더 클때만 하싱된 내용을 지정
- [ ] 에러처리 및 최적화
  - [ ] fs모듈 통일(vscode.workspace.fs, nodejs의 fs)
  - [ ] 네트워크 객체화(commons.ts에 네트워크 모듈을 삽입하고 필요한 곳에서 공통으로 사용)
