export class ToolbarButton {
    constructor(
        public routerLink: string[],
        public icon: string,
        public hint: string,
        public onClick: Function,
    ) { }
}

export class ToolbarOptions {
    constructor(
        public title: string,
        public longTitle: string,
        public showBackBtn: Boolean,
        public buttons: ToolbarButton[]
    ) { }
}