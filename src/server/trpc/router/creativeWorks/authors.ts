import type { Tag } from '@prisma/client';
import { CreativeWorkStatus, CreativeWorkType } from '@prisma/client';

import type { OmitPickAndSetToNonNullable } from '@server/ts';
import { router, haveAuthorPrivilegesProcedure } from '@server/trpc/trpc';
import { updateCreativeWorkTags } from '@server/utils/core/controllers';

import { z } from 'zod';

import { default as slugify } from 'slug';

// const CreativeWorkStatusExcludeDeleted = Object.values(CreativeWorkStatus).filter(item => item === CreativeWorkStatus.DELETED)

export const blogPostsRouter = router({
	createOne: haveAuthorPrivilegesProcedure
		.input(
			z.object({
				authorId: z.string(),
				tags: z.array(z.string()).min(3),
				status: z
					.enum([CreativeWorkStatus.PUBLIC, CreativeWorkStatus.PRIVATE])
					.optional()
					.default(CreativeWorkStatus.PUBLIC),
				typeData: z.object({
					content: z.string(),
					description: z.string(),
					// slug: z.string(),
					thumbnailUrl: z.string(),
					title: z.string(),
					languageTagId: z.string()
				})
			})
		)
		.mutation(async ({ ctx, input }) => {
			// const discussionForm = await ctx.prisma.creativeWork.create({
			// 	data: {
			// 		authorId: input.authorId,
			// 		status: input.status,
			// 		type: CreativeWorkType.DISCUSSION_FORUM,
			// 		discussionForum: { create: true }
			// 	}
			// });

			const slug = slugify(input.typeData.title);

			const filteredTags = input.tags
				.map((tag) => slugify(tag))
				.filter(Boolean);

			const creativeWork = await ctx.prisma.creativeWork.create({
				data: {
					authorId: input.authorId,
					status: input.status,
					type: CreativeWorkType.BLOG_POST,
					tags: {
						connectOrCreate: filteredTags.map((tag) => ({
							create: {
								name: tag,
								Stats: {
									connectOrCreate: { create: {}, where: { tagName: tag } }
								}
							},
							where: { name: tag }
						}))
					},
					blogPost: {
						create: {
							content: input.typeData.content,
							description: input.typeData.description,
							slug,
							thumbnailUrl: input.typeData.thumbnailUrl,
							title: input.typeData.title,
							updatedAt: null,
							languageTag: {
								connect: { id: input.typeData.languageTagId }
							},
							// discussionForum: { connect: { id: discussionForm.id } }
							discussionForum: {
								create: {
									updatedAt: null,
									creativeWork: {
										create: {
											authorId: input.authorId,
											status: input.status,
											type: CreativeWorkType.DISCUSSION_FORUM
										}
									}
								}
							}
						}
					}
				},
				include: {
					tags: true,
					blogPost: { include: { languageTag: true } },
					discussionForum: true
				}
			});

			ctx.prisma.tagStats.updateMany({
				data: {
					blogPostsCount: { increment: 1 }
				},
				where: { tagName: { in: creativeWork.tags.map((tag) => tag.name) } }
			});

			return creativeWork as OmitPickAndSetToNonNullable<
				typeof creativeWork,
				'blogPost' | 'discussionForum'
			>;
		}),
	updateOne: haveAuthorPrivilegesProcedure
		.input(
			z.object({
				authorId: z.string(),
				creativeWorkId: z.string(),
				creativeWorkBasics: z
					.object({
						status: z
							.enum([CreativeWorkStatus.PUBLIC, CreativeWorkStatus.PRIVATE])
							.optional()
					})
					.optional(),
				tags: z
					.object({
						added: z.array(z.string()).optional(),
						removed: z.array(z.string()).optional()
					})
					.optional(),
				typeData: z
					.object({
						content: z.string().optional(),
						description: z.string().optional(),
						// slug: z.string().optional(),
						thumbnailUrl: z.string().optional(),
						title: z.string().optional(),
						languageTagId: z.string().optional()
					})
					.optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			let creativeWork: { id: string } | undefined;
			let typeData: { creativeWorkId: string } | undefined;
			let tags: { tags: Tag[] } | undefined;

			if (input.creativeWorkBasics)
				creativeWork = await ctx.prisma.creativeWork.update({
					data: { status: input.creativeWorkBasics.status },
					where: { id: input.creativeWorkId },
					select: { id: true }
				});

			if (input.tags) {
				tags = await updateCreativeWorkTags(ctx.prisma, {
					creativeWorkId: input.creativeWorkId,
					creativeWorkType: CreativeWorkType.BLOG_POST,
					addedTags: input.tags.added,
					removedTags: input.tags.removed
				});
			}
			if (input.typeData)
				typeData = await ctx.prisma.blogPost.update({
					data: {
						content: input.typeData.content,
						description: input.typeData.description,
						// slug: input.typeData.slug,
						thumbnailUrl: input.typeData.thumbnailUrl,
						title: input.typeData.title,
						languageTagId: input.typeData.languageTagId
					},
					where: { creativeWorkId: input.creativeWorkId },
					select: { creativeWorkId: true }
				});

			return { creativeWork, typeData, tags };
		})
});
export const postsRouter = router({
	createOne: haveAuthorPrivilegesProcedure
		.input(
			z.object({
				authorId: z.string(),
				tags: z.array(z.string()).optional(),
				status: z
					.enum([CreativeWorkStatus.PUBLIC, CreativeWorkStatus.PRIVATE])
					.optional()
					.default(CreativeWorkStatus.PUBLIC),
				typeData: z.object({ content: z.string() })
			})
		)
		.mutation(async ({ ctx, input }) => {
			// const discussionForm = await ctx.prisma.creativeWork.create({
			// 	data: {
			// 		authorId: input.authorId,
			// 		status: input.status,
			// 		type: CreativeWorkType.DISCUSSION_FORUM,
			// 		discussionForum: { create: true }
			// 	}
			// });

			const creativeWork = await ctx.prisma.creativeWork.create({
				data: {
					authorId: input.authorId,
					status: input.status,
					type: CreativeWorkType.POST,
					tags: {
						connectOrCreate: input.tags?.map((tag) => ({
							create: {
								name: tag,
								Stats: {
									connectOrCreate: { create: {}, where: { tagName: tag } }
								}
							},
							where: { name: tag }
						}))
					},
					Post: {
						create: {
							content: input.typeData.content,
							updatedAt: null,
							// discussionForum: { connect: { id: discussionForm.id } }
							discussionForum: {
								create: {
									updatedAt: null,
									creativeWork: {
										create: {
											authorId: input.authorId,
											status: input.status,
											type: CreativeWorkType.DISCUSSION_FORUM
										}
									}
								}
							}
						}
					}
				},
				include: { tags: true, Post: true, discussionForum: true }
			});

			ctx.prisma.tagStats.updateMany({
				data: {
					postsCount: { increment: 1 }
				},
				where: { tagName: { in: creativeWork.tags.map((tag) => tag.name) } }
			});

			return creativeWork as OmitPickAndSetToNonNullable<
				typeof creativeWork,
				'Post' | 'discussionForum'
			>;
		}),
	updateOne: haveAuthorPrivilegesProcedure
		.input(
			z.object({
				authorId: z.string(),
				creativeWorkId: z.string(),
				creativeWorkBasics: z
					.object({
						status: z
							.enum([CreativeWorkStatus.PUBLIC, CreativeWorkStatus.PRIVATE])
							.optional()
					})
					.optional(),
				tags: z
					.object({
						added: z.array(z.string()).optional(),
						removed: z.array(z.string()).optional()
					})
					.optional(),
				typeData: z
					.object({
						content: z.string().optional()
					})
					.optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			let creativeWork: { id: string } | undefined;
			let typeData: { creativeWorkId: string } | undefined;
			let tags: { tags: Tag[] } | undefined;

			if (input.creativeWorkBasics)
				creativeWork = await ctx.prisma.creativeWork.update({
					data: { status: input.creativeWorkBasics.status },
					where: { id: input.creativeWorkId },
					select: { id: true }
				});

			if (input.tags) {
				tags = await updateCreativeWorkTags(ctx.prisma, {
					creativeWorkId: input.creativeWorkId,
					creativeWorkType: CreativeWorkType.BLOG_POST,
					addedTags: input.tags.added,
					removedTags: input.tags.removed
				});
			}
			if (input.typeData)
				typeData = await ctx.prisma.post.update({
					data: {
						content: input.typeData.content
					},
					where: { creativeWorkId: input.creativeWorkId },
					select: { creativeWorkId: true }
				});

			return { creativeWork, typeData, tags };
		})
});
export const discussionFormsPostsRouter = router({
	createOne: haveAuthorPrivilegesProcedure
		.input(
			z.object({
				authorId: z.string(),
				tags: z.array(z.string()).optional(),
				status: z
					.enum([CreativeWorkStatus.PUBLIC, CreativeWorkStatus.PRIVATE])
					.optional()
					.default(CreativeWorkStatus.PUBLIC),
				DiscussionForumPost: z.object({
					content: z.string(),
					discussionForumId: z.string()
				})
			})
		)
		.mutation(async ({ ctx, input }) => {
			// const discussionForm = await ctx.prisma.creativeWork.create({
			// 	data: {
			// 		authorId: input.authorId,
			// 		status: input.status,
			// 		type: CreativeWorkType.DISCUSSION_FORUM,
			// 		discussionForum: { create: true }
			// 	}
			// });

			const creativeWork = await ctx.prisma.creativeWork.create({
				data: {
					authorId: input.authorId,
					status: input.status,
					type: CreativeWorkType.DISCUSSION_FORUM,
					tags: {
						connectOrCreate: input.tags?.map((tag) => ({
							create: {
								name: tag,
								Stats: {
									connectOrCreate: { create: {}, where: { tagName: tag } }
								}
							},
							where: { name: tag }
						}))
					},
					DiscussionForumPost: {
						create: {
							content: input.DiscussionForumPost.content,
							discussionForumId: input.DiscussionForumPost.discussionForumId,
							updatedAt: null
						}
					}
				},
				include: { tags: true, DiscussionForumPost: true }
			});

			ctx.prisma.tagStats.updateMany({
				data: {
					postsCount: { increment: 1 }
				},
				where: { tagName: { in: creativeWork.tags.map((tag) => tag.name) } }
			});

			return creativeWork as OmitPickAndSetToNonNullable<
				typeof creativeWork,
				'DiscussionForumPost'
			>;
		}),
	updateOne: haveAuthorPrivilegesProcedure
		.input(
			z.object({
				authorId: z.string(),
				creativeWorkId: z.string(),
				content: z.string(),
				discussionForumId: z.string(),
				addedTags: z.array(z.string()).optional(),
				removedTags: z.array(z.string()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const DiscussionForumPost = await ctx.prisma.discussionForumPost.update({
				data: { content: input.content },
				where: { creativeWorkId: input.creativeWorkId },
				select: { creativeWorkId: true }
			});

			const tags = await updateCreativeWorkTags(ctx.prisma, {
				creativeWorkId: DiscussionForumPost.creativeWorkId,
				creativeWorkType: CreativeWorkType.POST,
				addedTags: input.addedTags,
				removedTags: input.removedTags
			});

			return { DiscussionForumPost, tags };
		})
});

export const authorsRouter = router({
	blogPosts: blogPostsRouter,
	posts: postsRouter,
	// discussionForms: discussionFormsRouter,
	discussionFormsPosts: discussionFormsPostsRouter,
	updateStatus: haveAuthorPrivilegesProcedure
		.input(
			z.object({
				authorId: z.string(),
				id: z.string(),
				status: z
					.enum([CreativeWorkStatus.PUBLIC, CreativeWorkStatus.PRIVATE])
					.optional()
					.default(CreativeWorkStatus.PUBLIC)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const data = undefined;

			await ctx.prisma.creativeWork.update({
				data: { status: input.status },
				where: { id: input.id },
				select: {}
			});

			return data;
		}),
	delete: haveAuthorPrivilegesProcedure
		.input(
			z.object({
				authorId: z.string(),
				creativeWorkId: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const deletedCreativeWork = await ctx.prisma.creativeWork.update({
				data: { status: CreativeWorkStatus.DELETED },
				where: { id: input.creativeWorkId }
			});

			return deletedCreativeWork;
		})
});
