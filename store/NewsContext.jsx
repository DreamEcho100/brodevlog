import { createContext, useState, useEffect, useContext } from 'react';

import UserContext from '@store/UserContext';

const NewsContext = createContext({
	news: {},
	isLoadingReactions: false,
	isLoadingContent: false,
	setNews: () => {},
	setIsLoadingReactions: () => {},
	checkDataForUpdates: () => {},
	handleSetNewsDataForFirstTime: () => {},
	handleLoadingArticleContent: () => {},
});

export const NewsContextProvider = ({ children }) => {
	const { user, ...UserCxt } = useContext(UserContext);

	const [news, setNews] = useState({});
	const [isLoadingReactions, setIsLoadingReactions] = useState(false);
	const [isLoadingContent, setIsLoadingContent] = useState(false);

	const checkDataForUpdates = (data) => {};

	const handleSetNewsDataForFirstTime = async (data) => {
		let extraData = {};

		if (
			/*!data.reactions &&  */
			!data.reactions ||
			(Array.isArray(data.reactions) && data.reactions.length === 0)
		) {
			extraData.reactions = [
				{ news_reaction_id: '', type: 'up', counter: 0 },
				{ news_reaction_id: '', type: 'down', counter: 0 },
			];
		} else if (
			data?.reactions &&
			data.reactions.length > 0 &&
			data.reactions.length !== 2
		) {
			const messingReactions = [];
			if (!data.reactions.find((item) => item.type === 'up')) {
				messingReactions.push({
					news_reaction_id: '',
					type: 'up',
					counter: 0,
				});
			}
			if (!data.reactions.find((item) => item.type === 'down')) {
				messingReactions.push({
					news_reaction_id: '',
					type: 'down',
					counter: 0,
				});
			}
			if (messingReactions.length !== 0) {
				extraData.reactions = [...data.reactions, ...messingReactions];
			}
		} else {
			extraData.reactions = data.reactions;
		}

		const reactionsSorted = [];
		extraData?.reactions.forEach((reaction) => {
			if (reactionsSorted.length === 0) {
				reactionsSorted.push(reaction);
			} else {
				if (reaction.type === 'up') {
					reactionsSorted.unshift(reaction);
				} else {
					reactionsSorted.push(reaction);
				}
			}
		});
		extraData.reactions = reactionsSorted;

		if (
			/*!data.comments && */
			!data.comments ||
			(Array.isArray(data.comments) && data.comments.length === 0)
		) {
			extraData.comments = [];
		}

		if (Object.keys(user).length === 0) {
			extraData.user_reaction = '';
		}

		setNews({
			...data,
			...extraData,
		});
	};

	const handleLoadingArticleContent = async () => {
		setIsLoadingContent(true);
		await fetch(`/api/v1/news/articles/article/content/${news.news_id}`)
			.then((response) => response.json())
			.then(({ message, status, data }) => {
				setNews((prev) => ({
					...prev,
					...data,
				}));
			})
			.catch((error) => console.error(error));
		setIsLoadingContent(false);
	};

	useEffect(() => {
		if (Object.keys(user).length === 0) {
			setNews((prev) => ({
				...prev,
				user_reaction: '',
			}));
		}
	}, [user]);

	useEffect(async () => {
		if (!UserCxt.isLoading && isLoadingReactions) {
			if (
				news.news_id &&
				(!news.user_reaction ||
					(news.user_reaction && news.user_reaction.length === 0))
			) {
				let query = `news_id=${news.news_id}`;
				if (user.id) query += `&news_reactor_id=${user.id}`;

				const {
					status,
					message,
					data: dataReaction,
				} = await fetch(`/api/v1/news/reactions/reaction/?${query}`).then(
					(response) => response.json()
				);

				if (status === 'error') {
					console.error(message);
					return;
				}

				const reactionsSorted = [];

				dataReaction?.reactions.forEach((reaction) => {
					if (reactionsSorted.length === 0) {
						reactionsSorted.push(reaction);
					} else {
						if (reaction.type === 'up') {
							reactionsSorted.unshift(reaction);
						} else {
							reactionsSorted.push(reaction);
						}
					}
				});

				setNews((prev) => ({
					...prev,
					user_reaction: dataReaction.user_reaction,
					reactions: reactionsSorted,
					// ...dataReaction,
				}));

				setIsLoadingReactions(false);
			}
		}
	}, [UserCxt.isLoading, isLoadingReactions]);

	useEffect(async () => {
		if (isLoadingContent) {
			if (!news.content) {
				await handleLoadingArticleContent();
			}
			setIsLoadingContent(false);
		}
	}, [isLoadingContent]);

	const context = {
		news,
		isLoadingReactions,
		isLoadingContent,
		setNews,
		setIsLoadingReactions,
		setIsLoadingContent,
		checkDataForUpdates,
		handleSetNewsDataForFirstTime,
		handleLoadingArticleContent,
	};

	return (
		<NewsContext.Provider value={context}>{children}</NewsContext.Provider>
	);
};

export default NewsContext;
