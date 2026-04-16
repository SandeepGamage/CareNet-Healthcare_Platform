import React from 'react';
import Navbar from '../../components/common/Navbar';
import { HeartPulse } from 'lucide-react';

export default function AboutUs() {
	return (
		<>
			<Navbar title="About Us" />
			<div className="min-h-screen pt-24 bg-gradient-to-br from-teal-50 via-white to-blue-50">
				<div className="container mx-auto px-4 py-12 max-w-4xl">
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-teal-600 to-blue-600 shadow-lg mb-4">
							<HeartPulse className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-4xl font-bold text-gray-900 mb-2">About CareNet</h1>
						<p className="text-gray-600 max-w-2xl mx-auto">CareNet connects patients and healthcare providers through a modern, secure platform — book appointments, get AI-powered symptom guidance, and manage care in one place.</p>
					</div>

					<div className="bg-white rounded-2xl p-8 shadow-lg">
						<h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
						<p className="text-gray-700 leading-relaxed">We aim to make quality healthcare accessible by providing digital tools that simplify booking, communication, and remote care.</p>

						<hr className="my-6" />

						<h3 className="text-xl font-semibold mb-3">What we offer</h3>
						<ul className="list-disc pl-5 text-gray-700 space-y-2">
							<li>Doctor discovery and appointment scheduling</li>
							<li>AI symptom checker for triage and guidance</li>
							<li>Secure messaging and telemedicine</li>
							<li>Prescription management and notifications</li>
						</ul>
					</div>
				</div>
			</div>
		</>
	);
}
