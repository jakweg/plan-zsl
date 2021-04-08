export class LessonDialogParams {
  public showing = false;
  public isGone = false;

  constructor(
    public subject: string,
    public clazz: string,
    public teacher: string[],
    public classroom: string[]) {
  }

  show() {
    setTimeout(() => {
      this.showing = true;
    }, 100);
    this.isGone = false;
  }

  hide() {
    this.showing = false;
    setTimeout(() => {
      if (!this.showing)
        this.isGone = true;
    }, 320);
  }
}
