<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { CastInterface } from '$lib/types';
	import Cast from '$lib/components/Cast.svelte';
	import TheCast from '$lib/components/TheCast.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	export let data: { ancestors: CastInterface[]; children: CastInterface[] };
	$: theCast = data.ancestors[data.ancestors.length - 1];
	$: ancestors = data.ancestors.slice(0, data.ancestors.length - 1);
	$: children = data.children;
</script>

<div class="" in:fade={{ duration: 200 }}>
	<PageHeader name="Thread" backButton />
	{#each ancestors as ancestor, index}
		{#if index == 0}
			<Cast cast={ancestor} pfpLineDown />
		{:else}
			<Cast cast={ancestor} pfpLineDown pfpLineUp />
		{/if}
	{/each}
	<!-- the cast -->
	<TheCast cast={theCast} pfpLineUp />
	{#each children as child}
		<Cast cast={child} />
	{/each}
</div>
