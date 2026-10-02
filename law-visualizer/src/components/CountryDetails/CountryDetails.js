import './CountryDetails.css';

function CountryDetails({ country, className = '' }) {
	if (!country) {
		return null;
	}

	return (
		<div className={`CountryDetails ${className}`.trim()}>
			{Object.entries(country).map(([label, value]) => (
				<div className="CountryDetails-row" key={label}>
					<div className="CountryDetails-label">{label}</div>
					<div className="CountryDetails-value">
						{label === 'Research Guides' && Array.isArray(value) ? (
							<ul className="CountryDetails-researchGuides">
								{value.map((guide) => (
									<li key={guide.href}>
										<a
											href={guide.href}
											target={guide.target}
											rel={guide.rel}
											aria-label={guide['aria-label']}
											title={guide.title}
										>
											{guide.text}
										</a>
									</li>
								))}
							</ul>
						) : (
							value ?? 'N/A'
						)}
					</div>
				</div>
			))}
		</div>
	);
}

export default CountryDetails;
