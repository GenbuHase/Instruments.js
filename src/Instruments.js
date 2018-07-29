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

		static get defaultMap () {
			return {
				"KeyZ": ["C", 0],
						"KeyS": ["C#", 0],
				"KeyX": ["D", 0],
						"KeyD": ["D#", 0],
				"KeyC": ["E", 0],
				"KeyV": ["F", 0],
						"KeyG": ["F#", 0],
				"KeyB": ["G", 0],
						"KeyH": ["G#", 0],
				"KeyN": ["A", 0],
						"KeyJ": ["A#", 0],
				"KeyM": ["B", 0],
				"Comma": ["C", 1],
						"KeyL": ["C#", 1],
				"Period": ["D", 1],
						"Semicolon": ["D#", 1],
				"Slash": ["E", 1],
				"IntlRo": ["F", 1],

				"KeyQ": ["C", 1],
						"Digit2": ["C#", 1],
				"KeyW": ["D", 1],
						"Digit3": ["D#", 1],
				"KeyE": ["E", 1],
				"KeyR": ["F", 1],
						"Digit5": ["F#", 1],
				"KeyT": ["G", 1],
						"Digit6": ["G#", 1],
				"KeyY": ["A", 1],
						"Digit7": ["A#", 1],
				"KeyU": ["B", 1],
				"KeyI": ["C", 2],
						"Digit9": ["C#", 2],
				"KeyO": ["D", 2],
						"Digit0": ["D#", 2],
				"KeyP": ["E", 2],
				"BracketLeft": ["F", 2],
						"Equal": ["F#", 2],
				"BracketRight": ["G", 2]
			};
		}
	}



	/**
	 * ノーツ
	 * 
	 * @memberof Instruments
	 * @extends OscillatorNode
	 */
	class Note extends OscillatorNode {
		/** ノーツの種類 */
		static get NoteType () { return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] }
		
		/**
		 * 基準周波数
		 * @return {Number}
		 */
		static get baseFrequency () { return 440 }

		/**
		 * 鍵盤番号からノーツを生成します
		 * 
		 * @param {Instrument} instrument ノーツと紐付ける楽器
		 * @param {Number} index 鍵盤番号
		 * @param {Number} [duration] 再生時間[ms]
		 * 
		 * @return {Note} 生成されたノーツ
		 */
		static createByIndex (instrument, index, duration) {
			if (!(instrument instanceof Instrument)) throw new ArgumentError.ArgumentNotAcceptableError("instrument", 1, "Instrument");
			if (typeof index !== "number") throw new ArgumentError.ArgumentNotAcceptableError("index", 2, "Number");

			return new Note(instrument, Note.NoteType[index % 12], Math.floor(index / 12), duration);
		}

		/**
		 * 完全音名からノーツを生成します
		 * 
		 * @param {Instrument} instrument ノーツと紐付ける楽器
		 * @param {String} noteName 完全音名(音名 + オクターブ数)
		 * @param {Number} [duration] 再生時間[ms]
		 * 
		 * @return {Note} 生成されたノーツ
		 */
		static createByNoteName (instrument, noteName, duration) {
			if (!(instrument instanceof Instrument)) throw new ArgumentError.ArgumentNotAcceptableError("instrument", 1, "Instrument");
			if (typeof noteName !== "string") throw new ArgumentError.ArgumentNotAcceptableError("noteName", 2, "String");
			
			const nameStructure = noteName.split(/(?=\d)/);
			return new Note(instrument, nameStructure[0], nameStructure.slice(1).join(""), duration);
		}



		/**
		 * ノーツを生成します
		 * 
		 * @param {Instrument} instrument ノーツと紐付ける楽器
		 * @param {String} [noteName="C"] 音名
		 * @param {Number} [octave=5] オクターブ数
		 * @param {Number} [duration=-1] 再生時間[ms] (-1 = 自動停止しない)
		 */
		constructor (instrument, noteName = "C", octave = 5, duration = -1) {
			if (!(instrument instanceof Instrument)) throw new ArgumentError.ArgumentNotAcceptableError("instrument", 1, "Instrument");
			if (!Note.NoteType.includes(noteName)) throw new ArgumentError.ArgumentNotAcceptableError("noteName", 2, "Note.NoteType.*");

			super(instrument);

			/** @type {Instrument} */
			this.instrument = instrument;
			/** @type {String} */
			this.noteName = noteName;
			/** @type {Number} */
			this.octave = parseInt(octave);
			/** @type {Number} */
			this.duration = duration;

			this.initialize();
		}

		/**
		 * 鍵盤番号
		 * @return {Number}
		 */
		get noteIndex () { return Note.NoteType.indexOf(this.noteName) + 12 * this.octave }

		/** 初期化処理を行います */
		initialize () {
			const { instrument } = this;

			this.type = instrument.type;
			this.frequency.value = Note.baseFrequency * Math.pow(2, (this.noteIndex - Note.NoteType.indexOf("A") - 12 * 4) / 12);
			
			this.connect(instrument.destination);
		}

		/**
		 * 完全音名にして返します
		 * @return {String}
		 */
		toString () { return `${this.noteName}${this.octave}` }
	}



	/**
	 * 和音ノーツ(コードノーツ)
	 * 
	 * @memberof Instruments
	 * @extends Array<Note>
	 */
	class Chord extends Array {
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
		 * @param {Note} rootNote ベースとなるノーツ
		 * @param {Array<Number>} chordType コードの種類
		 */
		constructor (rootNote, chordType) {
			if (!(rootNote instanceof Note)) throw new ArgumentError.ArgumentNotAcceptableError("rootNote", 1, "Note");
			if (!Array.isArray(chordType)) throw new ArgumentError.ArgumentNotAcceptableError("chordType", 2, "Array<Number>");
			
			const notes = [];
			for (const index of chordType) notes.push(Instruments.Note.createByIndex(rootNote.instrument, rootNote.noteIndex + index, rootNote.duration));

			super(...notes);

			/** @type {Note} */
			this.root = rootNote;
		}
	}



	/**
	 * 演奏に利用する楽器
	 * 
	 * @memberof Instruments
	 * @extends AudioContext
	 */
	const Instrument = (() => {
		class Instrument extends AudioContext {
			/** 楽器を生成します */
			constructor () {
				super();

				/** @type {CommandableWorker} */
				this.commander = new CommandableWorker(`${libRoot}/InstrumentWorker.js`);
				/** @type {NoteCollection} */
				this.noteQues = new NoteCollection();
			}

			/**
			 * 楽器の波形タイプ
			 * @return {OscillatorType}
			 */
			get type () { return "sine" }

			/**
			 * 楽器に紐づいたノーツを生成します
			 * 
			 * @param {String} [noteName] 音名
			 * @param {Number} [octave] オクターブ数
			 * @param {Number} [duration] 再生時間[ms]
			 * 
			 * @return {Note} 生成されたノーツ
			 */
			createNote (noteName, octave, duration) { return new Note(this, noteName, octave, duration) }
			
			/**
			 * 音源を再生します
			 * 
			 * @param {Note | Chord} source 音符 | コード
			 * @return {Promise<Number | Array<Number>>}
			 */
			async play (source) {
				if (![ Note, Chord ].some(type => source instanceof type)) throw new ArgumentError.ArgumentNotAcceptableError("source", 1, ["Note", "Chord"]);

				if (source instanceof Chord) {
					const ques = [];
					for (const note of source) ques.push(this.play(note));

					return await Promise.all(ques);
				}


			
				source.start(0);

				const noteId = this.noteQues.getNextId();
				this.noteQues[noteId] = source;

				if (0 <= source.duration) {
					await this.commander.requestCommand("Note.stop", [ noteId, source.duration ],
						noteInfo => noteInfo.noteId === noteId && noteInfo.duration === source.duration
					).then(() => this.stop(noteId));
				}

				return noteId;
			}

			/**
			 * 指定されたノーツを停止します
			 * @param {Number} noteId ノーツID
			 */
			stop (noteId) {
				this.noteQues[noteId].stop(0);
				delete this.noteQues[noteId];
			}
		}



		class Piano extends Instrument {
			constructor () {
				super();
			}

			/** @type {OscillatorType} */
			get type () { return "sine" }

			/**
			 * @param {String} [noteName]
			 * @param {Number} [octave]
			 * @param {Number} [duration]
			 * 
			 * @return {Chord}
			 */
			createNote (noteName, octave, duration) {
				const notes = new Chord(super.createNote(noteName, octave, duration), [0, 12]);

				const gains = [
					this.createGain(),
					this.createGain()
				];

				const now = this.currentTime;
				gains.forEach((gain, index) => {
					if (index === 0) {
						gain.gain.linearRampToValueAtTime(1, now);
						gain.gain.linearRampToValueAtTime(0, now + 1.60);
					} else if (index === 1) {
						gain.gain.linearRampToValueAtTime(0.2, now);
						gain.gain.linearRampToValueAtTime(0, now + 2.0);
					}
				});

				notes.forEach((note, index) => {
					note.connect(gains[index]);
					gains[index].connect(this.destination);
				});

				return notes;
			}
		}



		/**
		 * 実行中のNoteを格納するコレクション
		 * @extends Array
		 */
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



		Object.defineProperties(Instrument, {
			Piano: { value: Piano }
		});

		Instrument.Piano = Piano;

		return Instrument;
	})();



	/**
	 * 直観的な操作を可能にしたWorker
	 * 
	 * @extends Worker
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
		 * @param {CommandableWorker.ConditionDetectEvent} [conditionDetector] コマンドを受け取る追加条件
		 * 
		 * @return {Promise<any>} 戻り値が格納されているPromiseオブジェクト
		 */
		requestCommand (command, args = [], conditionDetector) {
			if (!command) throw new ArgumentError.ArgumentNotDefinedError("request", 1);
			
			super.postMessage({ command, args });

			return new Promise(resolve => {
				/** @param {MessageEvent} event */
				const detectorHook = event => {
					/** @type {CommandableWorker.CommandResponse} */
					const resp = event.data;

					if (resp.command === command && conditionDetector ? conditionDetector(resp.result) : true) {
						this.removeEventListener("message", detectorHook);
						resolve(resp.result);
					}
				};

				this.addEventListener("message", detectorHook);
			});
		}
	}

	/**
	 * コマンドの応答形式
	 * 
	 * @typedef {Object} CommandableWorker.CommandResponse
	 * @prop {String} command 実行されたコマンド名
	 * @prop {any} result コマンドの戻り値
	 */

	/**
	 * コマンドが正しく返却されたかどうか判定する関数
	 * 
	 * @callback CommandableWorker.ConditionDetectEvent
	 * @param {any} result 予定されている戻り値
	 */



	Object.defineProperties(Instruments, {
		Instrument: { value: Instrument },
		Note: { value: Note },
		Chord: { value: Chord }
	});
	
	Instruments.Instrument = Instrument;
	Instruments.Note = Note;
	Instruments.Chord = Chord;

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



/* global ArgumentError */