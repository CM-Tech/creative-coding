import { Component, JSX } from "solid-js";

export type Experiment={component:()=>JSX.Element;imgUrl:string;description:string;title:string;}