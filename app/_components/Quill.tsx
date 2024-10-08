"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import API from "@/app/_api";

import Icon from "@/app/_icons";

import Switch from "@/app/_components/Switch";

import { Markdown, Presets } from "@sombian/markdown";
import toast from "@/app/_utils/Toast";

const [CORE, FILE_SIZE, FILE_NAME] = [new Markdown(...Presets.NekoNote), 1024 * 10000, /^[a-zA-Z0-9._\-\s]+\.(?:gif|png|jpe?g|webp)$/];

interface EditorProps {
	init?: string;
	placeholder?: string;
	onChange?: (data: string) => void;
}

export default function Quill({ init, placeholder, onChange }: EditorProps) {
	const [data, DO_NOT_USE_THIS] = useState(init ?? "");

	const setData = useCallback(
		(_: typeof data) => {
			DO_NOT_USE_THIS(_);
			onChange?.(_);
		},
		[onChange],
	);

	const helper = useRef<HTMLDivElement>(null);
	const editor = useRef<HTMLDivElement>(null);
	const outline = useRef<HTMLDivElement>(null);

	const [size, setSize] = useState<DOMRect>();

	useLayoutEffect(() => {
		if (helper.current) {
			setSize(helper.current.getBoundingClientRect());
		}
	}, []);

	const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: "none" });

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		function handle(event: Event) {
			setTimeout(() => {
				if (size && editor.current && document.activeElement === editor.current) {
					// cache
					const [html, region] = [editor.current, window.getSelection()];

					if (region && 0 < region.rangeCount) {
						const [impl, r1, r2] = [{} as typeof style, region.getRangeAt(0).getBoundingClientRect(), html.getBoundingClientRect()];

						impl.top = r1.top - r2.top - size.height - 5;
						impl.left = r1.left - r2.left + r1.width / 2;

						if (!region.isCollapsed && 0 < region.getRangeAt(0).toString().length) {
							// show
							impl.visibility = "visible";
							impl.transform = "translate(-50%) scale(1)";
						} else {
							// hide
							impl.visibility = "hidden";
							impl.transform = "translate(-50%) scale(0)";
						}
						// reflect
						setStyle(impl);
					}
				} else {
					// reset
					setStyle({ opacity: 0, pointerEvents: "none" });
				}
			});
		}
		document.addEventListener("selectionchange", handle);
		return () => document.removeEventListener("selectionchange", handle);
	}, [size]);

	const [readonly, setReadOnly] = useState(false);

	const onDragEnter = useCallback((event: React.DragEvent) => {
		// :3
		event.preventDefault();
		event.stopPropagation();

		outline.current?.style.setProperty("border-color", "#8F95B2");
	}, []);

	const onDragLeave = useCallback((event: React.DragEvent) => {
		// :3
		event.preventDefault();
		event.stopPropagation();

		outline.current?.style.setProperty("border-color", null);
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			// :3
			event.preventDefault();
			event.stopPropagation();

			if (editor.current) {
				const files = Object.values(event.dataTransfer.items)
					.map((entry) => {
						switch (entry.kind) {
							case "file": {
								const file = entry.getAsFile();

								if (!file) {
									toast.error("파일을 업로드해주세요.");
									return null;
								}
								if (FILE_SIZE < file.size) {
									toast.error("최대 파일 크기는 10MB입니다.");
									return null;
								}
								if (!FILE_NAME.test(file.name)) {
									toast.error("파일의 이름을 확인해주세요.");
									return null;
								}

								return file;
							}
							default: {
								return null;
							}
						}
					})
					.filter((entry) => entry !== null);

				// seal
				setReadOnly(true);
				// cache
				const buffer = files.map((_) => `![Uploading ${_.name}...]()`);
				// render
				editor.current.innerHTML = (0 < data.length ? [data.replace(/\n/g, "<br>"), ...buffer] : buffer).join("<br>");

				Promise.all(
					files.map((file, index) =>
						API["{teamId}/images/upload"]
							.POST({}, file)
							.then((response) => {
								buffer[index] = `![${file.name}](${response.url})`;
							})
							.catch((error) => {
								buffer[index] = `![${file.name}](${error})`;
							})
							.finally(() => {
								editor.current!.innerHTML = (0 < data.length ? [data.replace(/\n/g, "<br>"), ...buffer] : buffer).join("<br>");
							}),
					),
				).finally(() => {
					// unseal
					setReadOnly(false);
					// reflect
					setData((0 < data.length ? [data, ...buffer] : buffer).join("\n"));
				});
			}
			outline.current?.style.setProperty("border-color", null);
		},
		[data, setData],
	);

	const inline = useCallback(
		(syntax: string) => {
			if (editor.current) {
				// cache
				const [html, region] = [editor.current, window.getSelection()];

				if (region === null) return;

				const { startOffset: start, endOffset: end } = region.getRangeAt(0);

				const insert = (() => {
					// eslint-disable-next-line no-plusplus
					for (let i = 0; i < syntax.length; ++i) {
						if (syntax[i] !== data[start - i - 1]) {
							return true;
						}
						if (syntax[i] !== data[end + i]) {
							return true;
						}
					}
					return false;
				})();

				const range = document.createRange();

				if (insert) {
					html.innerHTML = (data.slice(0, start) + syntax + data.slice(start, end) + syntax + data.slice(end)).replace(/\n/g, "<br>");
					range.setStart(html.firstChild!!, start + syntax.length);
					range.setEnd(html.firstChild!!, end + syntax.length);
				} else {
					html.innerHTML = (data.slice(0, start - syntax.length) + data.slice(start, end) + data.slice(end + syntax.length)).replace(/\n/g, "<br>");
					range.setStart(html.firstChild!!, start - syntax.length);
					range.setEnd(html.firstChild!!, end - syntax.length);
				}
				// don't know whats going on? that's ok
				region.removeAllRanges();
				region.addRange(range);
				html.focus();
				// reflect
				setData(unescape(html));
			}
		},
		[data, setData],
	);

	useEffect(() => {
		editor.current!.innerHTML = data;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="relative flex h-full min-h-max w-full rounded-[10px] border border-white/15 bg-background-secondary drop-shadow-sm">
			<Switch init="editor">
				<div className="flex h-full w-full flex-col">
					<div className="m-[-1px] rounded-t-[10px] border border-white/15 bg-background-tertiary text-text-default">
						<Switch.Case of="editor">
							<div className="mx-[-1px] mt-[-1px] flex">
								<button
									type="button"
									className="mb-[-1px] rounded-t-[10px] border border-white/15 border-b-transparent bg-background-secondary px-[16px] py-[8px] text-text-primary"
								>
									Write
								</button>
								<Switch.Jump to="viewer">
									<button id="to-viewer" type="button" className="mb-[-1px] border border-transparent px-[16px] py-[8px]">
										Preview
									</button>
								</Switch.Jump>
							</div>
						</Switch.Case>
						<Switch.Case of="viewer">
							<div className="mx-[-1px] mt-[-1px] flex">
								<Switch.Jump to="editor">
									<button id="to-editor" type="button" className="mb-[-1px] border border-transparent px-[16px] py-[8px]">
										Write
									</button>
								</Switch.Jump>
								<button
									type="button"
									className="mb-[-1px] rounded-t-[10px] border border-white/15 border-b-transparent bg-background-secondary px-[16px] py-[8px] text-text-primary"
								>
									Preview
								</button>
							</div>
						</Switch.Case>
					</div>
					<div className="rounded-b-[10px] px-[10px] py-[10px]">
						<Switch.Case of="editor">
							<div className="relative flex">
								<div
									ref={helper}
									style={style}
									className="absolute flex h-[40px] items-center justify-center overflow-hidden rounded-[7.5px] border border-white/15 bg-background-tertiary px-[3px] drop-shadow-lg [&>button:hover]:bg-white/15 [&>button]:flex [&>button]:aspect-square [&>button]:items-center [&>button]:rounded-[5px] [&>button]:px-[1.5px] [&>button]:py-[1.5px]"
								>
									<button type="button" aria-label="bold" onClick={() => inline("**")}>
										<Icon.Bold width={25} height={25} color="#64748b" />
									</button>
									<button type="button" aria-label="italic" onClick={() => inline("*")}>
										<Icon.Italic width={25} height={25} color="#64748b" />
									</button>
									<button type="button" aria-label="underline" onClick={() => inline("__")}>
										<Icon.Underline width={25} height={25} color="#64748b" />
									</button>
									<button type="button" aria-label="strikethrough" onClick={() => inline("~~")}>
										<Icon.StrikeThrough width={25} height={25} color="#64748b" />
									</button>
								</div>
								{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
								<div
									id="editor"
									ref={editor}
									contentEditable={!readonly}
									data-placeholder={placeholder}
									className="space-pre-wrap inline-block h-full min-h-[130px] w-full grow resize-y overflow-auto break-all rounded-[10px] border border-white/15 px-[10px] py-[10px] text-lg text-text-primary outline-none before:text-text-default focus:border-brand-primary [&:empty]:before:content-[attr(data-placeholder)]"
									//
									// feat: drop & drop
									//
									onDrop={onDrop}
									onDragEnd={onDrop}
									onDragOver={onDragEnter}
									onDragEnter={onDragEnter}
									onDragLeave={onDragLeave}
									//
									// feat: prevent html
									//
									onPaste={(event) => {
										// fuck off
										event.preventDefault();
										// get raw data
										const raw = event.clipboardData.getData("Text").replace(/https?:\/\/[^\s/$.?#].[^\s]*/g, (url) => `![](${url})`);
										// inset raw data
										document.execCommand("insertHTML", false, raw.replace(/\r?\n/g, "<br>"));
									}}
									onInput={(event) => {
										// cache
										const target = event.target as HTMLElement;

										if (target.children.length === 1 && target.firstChild?.nodeName === "BR") {
											target.lastChild?.remove();
										}
										// update
										setData(unescape(event.target as HTMLElement));
										// auto resize
										target.style.height = "auto";
										target.style.height = `calc(${target.style.borderTopWidth} + ${target.scrollHeight}px + ${target.style.borderBottomWidth})`;
									}}
									onKeyDown={(event) => {
										// eslint-disable-next-line default-case
										switch (event.key) {
											case "Enter": {
												// fuck off
												event.preventDefault();
												// insert <br>
												document.execCommand("insertLineBreak");
												break;
											}
										}
									}}
								/>
								<div ref={outline} className="pointer-events-none absolute inset-[5px] rounded-[10px] border-[2.25px] border-dashed border-transparent" />
							</div>
						</Switch.Case>
						<Switch.Case of="viewer">
							<div
								className="h-full min-h-[130px] w-full rounded-[10px] border border-transparent px-[10px] py-[10px] text-lg font-normal text-text-primary"
								// eslint-disable-next-line react/no-danger
								dangerouslySetInnerHTML={{ __html: data && `<article class="md">${CORE.run(data)}</article>` }}
							/>
						</Switch.Case>
					</div>
				</div>
			</Switch>
		</div>
	);
}

function unescape(html: HTMLElement) {
	return Object.entries({
		"<br>": "\n",
		"&nbsp;": " ",
		"&lt;": "<",
		"&gt;": ">",
		"&amp;": "&",
		"&#035;": "#",
		// eslint-disable-next-line quotes
		"&quot;": '"',
		"&#039;": "'",
		"&apos;": "'",
	}).reduce((accumulate, [match, char]) => accumulate.replace(new RegExp(match, "g"), char), html.innerHTML);
}
