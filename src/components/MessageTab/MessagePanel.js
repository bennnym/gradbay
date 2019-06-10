import React, { useEffect, useState, useRef } from "react";
import { InputGroup, FormControl, Button } from "react-bootstrap";
import SingleMessage from "./SingleMessage";
import "./Message.css";
import _ from "underscore";
import { databaseRef } from "../../config/firebase";
import axios from "axios";
import links from "../../links";
import { connect } from "react-redux";
import moment from "moment";

const MessagePanel = props => {
	const [msgContentKeys, setMsgContentKeys] = useState("");
	const [input, setInput] = useState("");
	const [company, setCompany] = useState("");
	const [msgObj, setmsgObj] = useState("");

	const { messageContent, student, employer, studentName } = props;

	useEffect(() => {
		getMsgContent();
		getEmployerInfo();
	}, []);

	const getMsgContent = () => {
		setMsgContentKeys(_.keys(messageContent).reverse());
		setmsgObj(messageContent);
	};

	const getEmployerInfo = () => {
		if (student) {
			return;
		}
		axios.get(links.root + `employer/${props.employerID}`).then(res => {
			setCompany(res.data.company);
		});
	};

	const _getInput = e => {
		setInput(e.target.value);
	};

	const _handleEnter = e => {
		if (e.key === "Enter") {
			_handleClick();
		}
	};

	const _handleClick = () => {
		if (employer) {
			var messageObj = {
				content: input,
				employer_name: company,
				employer_read: employer,
				from: employer ? "employer" : "student",
				from_employer: employer,
				from_student: student,
				student_name: studentName,
				student_read: student,
			};
		} else if (student) {
			var messageObj = {
				content: input,
				employer_name: msgObj[msgContentKeys[0]]["employer_name"],
				employer_read: employer,
				from: employer ? "employer" : "student",
				from_employer: employer,
				from_student: student,
				student_name: studentName,
				student_read: student,
			};
		}

		const firebaseRef = databaseRef
			.child(props.employerID)
			.child(`${props.studentID}-${props.studentName}`)
			.child(moment().format());

		const otherRef = databaseRef
			.child(props.employerID)
			.child(`${props.studentID}-${props.studentName}`);

		otherRef.on("value", snapshot => {
			setmsgObj(snapshot.val());
			setMsgContentKeys(_.keys(snapshot.val()).reverse());
			// reverse shows the last message first
		});

		firebaseRef.set(messageObj);
		setInput(""); // clear the input
	};
	return (
		<React.Fragment>
			<div className='message-content'>
				{msgContentKeys.length >= 1
					? msgContentKeys.map((key, index) => {
								return (
									<SingleMessage
										key={index}
										identifier={msgObj[key]["from"]}
										sender={
											msgObj[key]["from_employer"]
												? msgObj[key]["employer_name"]
												: msgObj[key]["student_name"]
										} // check who sent msg
										content={msgObj[key]["content"]}
									/>
								);
							}
					)
					: ""}
			</div>
			<InputGroup className='message-input'>
				<InputGroup.Prepend />
				<FormControl
					onKeyDown={_handleEnter}
					onChange={_getInput}
					as='textarea'
					aria-label='With textarea'
					value={input}
				/>
				<Button onClick={_handleClick} variant='dark'>
					Send
				</Button>
			</InputGroup>
		</React.Fragment>
	);
};

const mapStateToProps = state => {
	return {
		employer: state.employer,
		student: state.student,
	};
};

export default connect(mapStateToProps)(MessagePanel);