/* eslint-env worker */

/* global Errors */
importScripts("./Errors.js");



/**
 * TimingManagerのルートオブジェクト
 * 
 * @namespace
 * @author Genbu Hase
 */
const TimingManager = (() => {
	const TimingManager = {};



	/**
	 * 生成された楽器のコレクション
	 * 
	 * @type {Array<{}>}
	 * @memberof TimingManager
	 */
	const instruments = [];

	/**
	 * 簡略化関数のコレクション
	 */
	const Utilizes = {
		Instrument: {
			/**
			 * 楽器IDの次の空き番地を返す
			 * @return {Number} 楽器ID
			 */
			getNextId () {
				const index = instruments.findIndex(instrument => !instrument);
				return index < 0 ? instruments.length : index;
			}
		}
	};



	/**
	 * 実行できるコマンド
	 * @memberof TimingManager
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

		Instrument: {
			/**
			 * 楽器IDの次の空き番地を返す
			 * @return {Number} 楽器ID
			 */
			getNextId: () => Commands.return("Instrument.getNextId", Utilizes.Instrument.getNextId()),

			/**
			 * 楽器を登録します
			 * 
			 * @param {Object} instrument 楽器
			 * @return {Number} 新しく割り当てられた楽器ID
			 */
			register () {
				const id = Utilizes.Instrument.getNextId();
				instruments[id] = {};

				return Commands.return("Instrument.register", id);
			}
		},

		Note: {
			stop (instrumentId, noteId, after) {
				self.setTimeout(() => Commands.return("Note.stop", { instrumentId, noteId, after }), after);
			}
		}
	};

	

	Object.defineProperties(TimingManager, {
		instruments: { value: instruments, enumerable: true },
		Commands: { value: Commands }
	});

	TimingManager.instruments = instruments;
	TimingManager.Commands = Commands;
	
	return TimingManager;
})();

/**
 * @typedef {Object} CommandRequest
 * @prop {String} command 実行するコマンド名
 * @prop {Array<any>} args コマンドの引数
 */



self.addEventListener("message", event => {
	/** @type {CommandRequest} */
	const data = event.data;

	if (!data.command) throw new Errors.ArgumentError.ArgumentNotAcceptableError("command", null, "String");
	if (!TimingManager.Commands.deepBrowse(data.command)) throw new ReferenceError("Provided command doesn't exist");
	if (!data.args) data.args = [];

	TimingManager.Commands.deepBrowse(data.command)(...data.args);
});