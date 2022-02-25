interface IUrlOptionsQueriesTypeCommentMain {
	type: 'comment_main';
	last_comment_created_at?: string;
	comments_to_not_fetch?: string[];
}
interface IUrlOptionsQueriesTypeCommentMainReply {
	type: 'comment_main_reply';
	replies_to_not_fetch?: string[];
	last_reply_created_at?: string;
}
// comment_main
// comment_main_reply
export interface IGetNewsItemCommentsReqArgs {
	urlOptions: {
		params: {
			news_id: string;
		};
		queries:
			| IUrlOptionsQueriesTypeCommentMain
			| IUrlOptionsQueriesTypeCommentMainReply;
	};
}

/* */

interface ICreateNewsItemCommentReqArgsPropsBodyContentBasic {
	news_id: string;
	content: string;
}
interface ICreateNewsItemCommentReqArgsPropsBodyContentTypeCommentMain
	extends ICreateNewsItemCommentReqArgsPropsBodyContentBasic {
	type: 'comment_main';
}
interface ICreateNewsItemCommentReqArgsPropsBodyContentTypeCommentMainReply
	extends ICreateNewsItemCommentReqArgsPropsBodyContentBasic {
	type: 'comment_main_reply';
	parent_id: string;
	reply_to_comment_id?: string;
	reply_to_user_id: string;
}
export interface ICreateNewsItemCommentReqArgs {
	urlOptions: {
		params: {
			news_id: string;
		};
	};
	headersList: {
		Authorization: string;
	};
	bodyContent:
		| ICreateNewsItemCommentReqArgsPropsBodyContentTypeCommentMain
		| ICreateNewsItemCommentReqArgsPropsBodyContentTypeCommentMainReply;
}
