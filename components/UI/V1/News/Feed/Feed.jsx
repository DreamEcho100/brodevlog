import { useContext, useEffect } from 'react';

import classes from './Feed.module.css';

import NewsContext from '@store/NewsContext';
import { handleLoadMoreNewsItems } from '@store/NewsContext/actions';
import { handleAllClasses } from '../../utils/index';

import Container from '@components/UI/V1/News/Container';
import Wrapper from '@components/UI/V1/Wrapper';

const Feed = ({
	defaultClasses = 'feed',
	extraClasses = '',
	className = '',
	news = [],
	newsFetchRouteQuery,
	...props
}) => {
	const { state, dispatch, types } = useContext(NewsContext);

	useEffect(() => {
		dispatch({
			type: types.INIT_STATE,
			payload: { news, newsType: types.ALL },
		});
	}, []);

	const allClasses = handleAllClasses({
		classes,
		defaultClasses,
		extraClasses,
		className,
	});

	const feedProps = {
		className: allClasses,
		...props,
	};

	return (
		<section {...feedProps}>
			{state.news.map((item, index) => (
				<Container
					key={`Feed-${index}-${item.news_id}`}
					newsItem={item}
					detailsType='description'
					modalOnClick
					className={classes['news-container']}
				/>
			))}
			{!state.hit_news_items_limit && (
				<Wrapper
					style={{
						width: '100%',
						maxWidth: '100rem',
						marginLeft: 'auto',
						marginRight: 'auto',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<button
						disabled={state.isLoadingMoreNewsItems}
						onClick={() =>
							handleLoadMoreNewsItems({
								dispatch,
								last_news_item_created_at: state.last_news_item_created_at,
								newsFetchRouteQuery,
							})
						}
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<strong>Load More</strong>
					</button>
				</Wrapper>
			)}
		</section>
	);
};

export default Feed;
