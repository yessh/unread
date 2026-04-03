export function FileTypeGuide() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 모바일 가이드 */}
      <div className="card">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <h3 className="text-lg font-semibold text-content-primary">모바일</h3>
        </div>
        <div className="space-y-3 text-sm text-content-secondary">
          <p>
            <strong className="text-content-primary">1. 카카오톡 열기</strong>
            <br />
            분석하고 싶은 대화방 선택
          </p>
          <p>
            <strong className="text-content-primary">2. 메뉴 버튼 클릭</strong>
            <br />
            우측 상단 ⋮ 또는 설정 메뉴
          </p>
          <p>
            <strong className="text-content-primary">3. 대화 내보내기</strong>
            <br />
            "대화 파일로 저장" 선택
          </p>
          <p>
            <strong className="text-content-primary">4. .zip 파일 업로드</strong>
            <br />
            생성된 .zip 파일을 여기 드래그하세요
          </p>
        </div>
      </div>

      {/* PC 가이드 */}
      <div className="card">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl">💻</span>
          <h3 className="text-lg font-semibold text-content-primary">PC</h3>
        </div>
        <div className="space-y-3 text-sm text-content-secondary">
          <p>
            <strong className="text-content-primary">1. 카카오톡 열기</strong>
            <br />
            분석하고 싶은 대화방 선택
          </p>
          <p>
            <strong className="text-content-primary">2. 메뉴 클릭</strong>
            <br />
            상단 메뉴 또는 마우스 우클릭
          </p>
          <p>
            <strong className="text-content-primary">3. 대화 내보내기</strong>
            <br />
            "대화내용 저장" 선택
          </p>
          <p>
            <strong className="text-content-primary">4. .csv 파일 업로드</strong>
            <br />
            생성된 .csv 파일을 여기 드래그하세요
          </p>
        </div>
      </div>
    </div>
  )
}
