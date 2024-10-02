export const steps: any = [
	// Example steps
	{
		icon: <>👋</>,
		title: "Welcome to Memoire!",
		content: <>Welcome to Memoire, an onboarding flow for Next.js!</>,
		selector: "#onboarding-step-1",
		side: "left",
		showControls: true,
		pointerPadding: -1,
		pointerRadius: 24
	},
	{
		icon: <>🪄</>,
		title: "It's like magic!",
		content: (
			<>
				Memoire uses <b>framer-motion</b> to handle animations and{" "}
				<b>reactour</b> to handle the onboarding flow.
			</>
		),
		selector: "#onboarding-step-2",
		side: "top",
		showControls: true,
		pointerPadding: -1,
		pointerRadius: 24,
	},
	{
		icon: <>🎩</>,
		title: "Works across routes!",
		content: (
			<>
				Memoire uses <b>framer-motion</b> to handle animations and{" "}
				<b>reactour</b> to handle the onboarding flow.
			</>
		),
		selector: "#onboarding-step-3",
		side: "top",
		showControls: true,
		pointerPadding: -1,
		pointerRadius: 24,
	},
	{
		icon: <>🌀</>,
		title: "Customize your steps",
		content: <>Customize each step of your onboarding process!</>,
		selector: "#onboarding-step-4",
		side: "top",
		showControls: true,
		pointerPadding: -1,
		pointerRadius: 24,
	},
	{
		icon: <>👉</>,
		title: "Custom pointers",
		content: (
			<>
				Full control over your pointer content, fully compatible with custom
				components like <b>shadcn/ui</b>.
			</>
		),
		selector: "#onboarding-step-5",
		side: "top",
		showControls: true,
		pointerPadding: -1,
		pointerRadius: 24,
	},
	{
		icon: <>⭐️</>,
		title: "Github",
		content: <>Star this repo!</>,
		selector: "#onboarding-step-6",
		side: "top",
		showControls: true,
		pointerPadding: -1,
		pointerRadius: 24,
		nextRoute: "/page-two",
	},
	{
		icon: <>🚀</>,
		title: "Change routes",
		content: <>Memoire even works across routes!</>,
		selector: "#onboarding-step-7",
		side: "bottom",
		showControls: true,
		pointerPadding: 5,
		pointerRadius: 10,
		prevRoute: "/",
	},
];
