/**
 * @namespace
 * @author Genbu Hase
 */
const InstrumentWorker = (() => {
	class InstrumentWorker {}



	/**
	 * 実行できるコマンド
	 * @memberof InstrumentWorker
	 */
	const Commands = {
		/**
		 * ブラウザ側に値を返す
		 * 
		 * @param {String} command 自身のコマンド名
		 * @param {any} result 返す値
		 * 
		 * @return {any} 返した値
		 */
		return (command, result) {
			self.postMessage({ command, result });
			return result;
		},

		/**
		 * 下層部のコマンドを参照して返す
		 * 
		 * @param {String} schemeStr 参照文字列
		 * @return {any} 参照されたコマンド
		 */
		deepBrowse (schemeStr) {
			if (!schemeStr) throw new ArgumentError.ArgumentNotDefinedError("schemeStr", 1);

			const nests = schemeStr.split(".");

			let deepest = Commands;
			for (const nest of nests) {
				try {
					deepest = deepest[nest];
				} catch (error) {
					throw new ReferenceError("Provided scheme doesn't exist");
				}
			}

			return deepest;
		},

		Note: {
			/**
			 * 指定されたノーツを一定時間後に停止します
			 * 
			 * @param {Number} noteId ノーツID
			 * @param {Number} afterMilliseconds 待機時間[ms]
			 */
			stop (noteId, afterMilliseconds) {
				self.setTimeout(() => Commands.return("Note.stop", { noteId, duration: afterMilliseconds }), afterMilliseconds);
			}
		}
	};

	/**
	 * コマンドの要請形式
	 * 
	 * @typedef {Object} InstrumentWorker.CommandRequest
	 * @prop {String} command 実行するコマンド名
	 * @prop {Array<any>} args コマンドの引数
	 */



	self.addEventListener("message", event => {
		/** @type {InstrumentWorker.CommandRequest} */
		const data = event.data;
	
		if (!data.command) throw new ArgumentError.ArgumentNotAcceptableError("command", null, "String");
		if (!InstrumentWorker.Commands.deepBrowse(data.command)) throw new ReferenceError("Provided command doesn't exist");
		if (!data.args) data.args = [];
	
		InstrumentWorker.Commands.deepBrowse(data.command)(...data.args);
	});

	

	Object.defineProperties(InstrumentWorker, {
		Commands: { value: Commands }
	});

	InstrumentWorker.Commands = Commands;
	
	return InstrumentWorker;
})();



/* eslint-env worker */

/* global ArgumentError */
importScripts("./modules/Errors.js");