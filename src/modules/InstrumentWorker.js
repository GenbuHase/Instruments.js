/* global Errors */
importScripts("./Errors.js");



/**
 * @namespace
 * @author Genbu Hase
 */
const InstrumentWorker = (() => {
	class InstrumentWorker {}



	/**
	 * 簡略化関数
	 */
	const Utilizes = {};



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
			if (!schemeStr) throw new Errors.ArgumentError.ArgumentNotDefinedError("schemeStr", 1);

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
				self.setTimeout(() => Commands.return("Note.stop", { noteId, afterMilliseconds }), afterMilliseconds);
			}
		}
	};

	/**
	 * @typedef {Object} Commander.CommandRequest
	 * @prop {String} command 実行するコマンド名
	 * @prop {Array<any>} args コマンドの引数
	 */



	self.addEventListener("message", event => {
		/** @type {Commander.CommandRequest} */
		const data = event.data;
	
		if (!data.command) throw new Errors.ArgumentError.ArgumentNotAcceptableError("command", null, "String");
		if (!Commander.Commands.deepBrowse(data.command)) throw new ReferenceError("Provided command doesn't exist");
		if (!data.args) data.args = [];
	
		Commander.Commands.deepBrowse(data.command)(...data.args);
	});

	

	Object.defineProperties(Commander, {
		instruments: { value: instruments, enumerable: true },
		Commands: { value: Commands }
	});

	Commander.instruments = instruments;
	Commander.Commands = Commands;
	
	return Commander;
})();



/* eslint-env worker */