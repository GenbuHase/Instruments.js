/*/
 *  ______ ______ ______ ______ ______ ______ ______ ______ ______ ______ ______ 
 * |     _|     _|     _|     _|     _|     _|     _|     _|     _|     _|      |
 * | I  (_  n  (_  s  (_  t  (_  r  (_  u  (_  m  (_  e  (_  n_ (_  t_ (_  s_   |
 * |______|______|______|______|______|______|______|______|_( )__|_( )__|_( )__|
 *                                                         |     _|     _|      |
 *                                                         | .  (_  j  (_  s    |
 *                                                         |______|______|______|
/*/



/**
 * @namespace
 * @author Genbu Hase
 */
const Instruments = (libRoot => {
	class Instruments {
		/**
		 * Instruments.jsのルートディレクトリ
		 * @return {String}
		 */
		static get libRoot () { return libRoot }
	}



	/**
	 * ノーツ
	 * @memberof Instruments
	 */
	class Note {
		/** ノーツの種類 */
		static get NoteType () { return ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"] }

		/**
		 * 鍵盤番号からノーツを生成します
		 * 
		 * @param {Number} index 鍵盤番号
		 * @param {Number} [duration] 再生時間
		 * 
		 * @return {Note} 生成された基礎音
		 */
		static createByIndex (index, duration) {
			if (typeof index !== "number") throw new Errors.ArgumentError.ArgumentNotAcceptableError("index", 1, "Number");

			return new Note(Note.NoteType[index % 12], Math.floor(index / 12) + 1, duration);
		}



		/**
		 * ノーツを生成します
		 * 
		 * @param {String} [scale="C"] スケール
		 * @param {Number} [octave=3] オクターブ数
		 * @param {Number} [duration=-1] 再生時間[ms] (-1 = 自動停止しない)
		 */
		constructor (scale = "C", octave = 3, duration = -1) {
			this.scale = scale;
			this.octave = octave;
			this.duration = duration;
		}

		/**
		 * 鍵盤番号
		 * @return {Number}
		 */
		get noteIndex () { return Note.NoteType.indexOf(this.scale) + 12 * (this.octave - 1) }

		/**
		 * 音源の周波数
		 * @return {Number}
		 */
		get frequency () { return 27.500 * Math.pow(2, this.noteIndex / 12) }

		/**
		 * 文字列化して返します
		 * @return {String}
		 */
		toString () { return `${this.scale}${this.octave}` }
	}

	/**
	 * 和音ノーツ(コードノーツ)
	 * @memberof Instruments
	 */
	class Chord {
		/** コードの種類 */
		static get ChordType () {
			return {
				MAJOR: [0, 4, 7],
				MINOR: [0, 3, 7],
				SUS2: [0, 2, 7],
				SUS4: [0, 5, 7],
				AUG: [0, 4, 8]
			};
		}



		/**
		 * ノーツを基にコードを生成します
		 * 
		 * @param {Instruments.Note} rootNote
		 * @param {Instruments.Chord.ChordType} type
		 */
		constructor (rootNote, type) {
			if (!(rootNote instanceof Instruments.Note)) throw new Errors.ArgumentError.ArgumentNotAcceptableError("rootNote", 1, "Note");
			if (!Array.isArray(type)) throw new Errors.ArgumentError.ArgumentNotAcceptableError("type", 2, "Array<Number>");
			
			this.root = rootNote;
			
			/** @type {Array<Note>} */
			this.notes = [];
			for (const index of type) this.notes.push(Instruments.Note.createByIndex(rootNote.noteIndex + index, rootNote.duration));
		}
	}



	/**
	 * 直観的な操作を可能にしたWorker
	 * @author Genbu Hase
	 */
	class CommandableWorker extends Worker {
		/**
		 * CommandableWorkerを生成します
		 * @param {String} stringUrl Workerとして起動するスクリプト
		 */
		constructor (stringUrl) { super(stringUrl) }

		/**
		 * コマンドの実行を要求します
		 * 
		 * @param {String} command 実行するコマンド名
		 * @param {Array<any>} [args=[]] コマンドの引数
		 * @param {Function} [checkFunc] コマンドを受け取る追加条件
		 * 
		 * @return {Promise<any>} 実行結果が格納されているPromiseオブジェクト
		 */
		requestCommand (command, args = [], checkFunc) {
			if (!command) throw new Errors.ArgumentError.ArgumentNotDefinedError("request", 1);
			
			super.postMessage({ command, args });

			return new Promise(resolve => {
				/** @param {MessageEvent} event */
				const detectorHook = event => {
					/** @type {CommandableWorker.CommandResponse} */
					const resp = event.data;

					if (resp.command === command && checkFunc ? checkFunc(resp.result) : true) {
						this.removeEventListener("message", detectorHook);
						resolve(resp.result);
					}
				};

				this.addEventListener("message", detectorHook);
			});
		}
	}
	
	/**
	 * @typedef {Object} CommandableWorker.CommandResponse
	 * @prop {String} command 実行されたコマンド名
	 * @prop {any} result 実行結果
	 */

	
	
	/**
	 * 演奏に利用する楽器
	 * @memberof Instruments
	 */
	const Instrument = (() => {
		class Instrument extends AudioContext {
			/** 楽器を生成します */
			constructor () {
				super();

				/** @type {Boolean} */
				this.initialized = false;
				/** @type {NoteCollection} */
				this.noteQues = new NoteCollection();

				COMMANDER.requestCommand("Instrument.register").then(id => {
					this.id = id;
					this.initialized = true;
				});
			}

			/**
			 * 楽器の波形タイプ
			 * @return {OscillatorType}
			 */
			get type () { return "sine" }

			/**
			 * イベントフックを登録します
			 * 
			 * @param {Instrument.EventType} eventName イベント名
			 * @param {Function} [callback] コールバック関数
			 * 
			 * @return {Promise<Instrument>}
			 */
			on (eventName, callback) {
				switch (eventName) {
					default:
						throw new Errors.ArgumentError.ArgumentNotAcceptableError("eventName", 1);

					case "initialized":
						return new Promise(resolve => {
							const detector = setInterval(() => {
								if (this.initialized) {
									clearInterval(detector);

									callback && callback(this);
									resolve(this);
								}
							});
						});
				}
			}

			/** @param {Number} [frequency] */
			createOscillator (frequency) {
				const oscillator = super.createOscillator();
				oscillator.type = this.type;
				frequency && (oscillator.frequency.value = frequency);
				
				oscillator.connect(this.destination);
				return oscillator;
			}
			
			/**
			 * 音源を再生します
			 * 
			 * @param {Note | Instruments.Chord} source 音符 | コード
			 * @return {Promise<[ Number, Number ]>}
			 */
			async play (source) {
				if (!(
					source instanceof Instruments.Note ||
					source instanceof Instruments.Chord
				)) throw new Errors.ArgumentError.ArgumentNotAcceptableError("source", 1, ["Note", "Chord"]);

				if (source instanceof Instruments.Chord) {
					const ques = [];
					for (const note of source.notes) ques.push(this.play(note));

					return await Promise.all(ques);
				}


			
				const sound = this.createOscillator(source.frequency);
				sound.start(0);

				const noteId = this.noteQues.getNextId();
				this.noteQues[noteId] = sound;

				if (0 <= source.duration) {
					await COMMANDER.requestCommand("Note.stop", [ this.id, noteId, source.duration ],
						noteInfo => noteInfo.instrumentId === this.id && noteInfo.noteId === noteId
					).then(() => this.stop(noteId));
				}

				return [ this.id, noteId ];
			}

			/**
			 * 指定されたノーツを停止します
			 * @param {Number} noteId ノーツID
			 */
			stop (noteId) {
				this.noteQues[noteId].stop(0);
				this.noteQues[noteId] = undefined;
			}
		}

		/**
		 * @typedef {"initialized"} Instrument.EventType
		 */



		//class NoteHolder



		/** 実行中のNoteを格納するコレクション */
		class NoteCollection extends Array {
			/**
			 * NoteCollectionを生成します
			 * @param {...Note} notes
			 */
			constructor (...notes) {
				super(...notes);
			}

			/**
			 * ノーツIDの次の空き番地を返します
			 * @return {Number} ノーツID
			 */
			getNextId () {
				const index = this.findIndex(note => !note);
				return index < 0 ? this.length : index;
			}
		}



		return Instrument;
	})();



	/**
	 * 遅延処理に利用するコマンドワーカー
	 * 
	 * @type {CommandableWorker}
	 * @memberof Instruments
	 */
	const COMMANDER = new CommandableWorker(`${libRoot}/modules/InstrumentWorker.js`);



	Object.defineProperties(Instruments, {
		Instrument: { value: Instrument },
		Note: { value: Note },
		Chord: { value: Chord },

		COMMANDER: { value: COMMANDER, enumerable: true }
	});
	
	Instruments.Instrument = Instrument;
	Instruments.Note = Note;
	Instruments.Chord = Chord;

	Instruments.COMMANDER = COMMANDER;

	return Instruments;
})(
	(() => {
		/** Instruments.jsのルートファイル名 */
		const libMainFile = "Instruments.js";
		/** @type {HTMLScriptElement} */
		const script = document.querySelector(`Script[Src$="${libMainFile}"]`);
		
		return script.src.split("/").slice(0, -1).join("/");
	})()
);



/* global Errors */